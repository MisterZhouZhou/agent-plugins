/**
 * Codex App CDP 注入器最小模板。
 * Node 20+ 可使用全局 fetch；WebSocket 可由运行时提供，或由调用方注入构造器。
 */

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

export class CdpError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'CdpError';
    this.code = code;
    this.details = details;
  }
}

function assertLoopbackUrl(rawUrl, port, targetId) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'ws:' || !LOOPBACK_HOSTS.has(url.hostname)) {
    throw new CdpError('INVALID_TARGET', 'CDP WebSocket 必须使用 loopback ws 地址');
  }
  if (String(url.port || 80) !== String(port)) {
    throw new CdpError('INVALID_TARGET', 'CDP WebSocket 端口不匹配');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new CdpError('INVALID_TARGET', 'CDP WebSocket 不得包含凭据、查询参数或片段');
  }
  if (targetId && url.pathname !== `/devtools/page/${targetId}`) {
    throw new CdpError('INVALID_TARGET', 'CDP target ID 不匹配');
  }
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) throw new CdpError('DISCOVERY_FAILED', `${url} 返回 ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error instanceof CdpError) throw error;
    throw new CdpError('DISCOVERY_FAILED', `${url} 请求失败`, error);
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverDebugTarget({
  port,
  expectedPid,
  expectedBrowserId,
  getListeningPid,
  timeoutMs = 2_000,
  fetchImpl = fetch,
} = {}) {
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new TypeError('port 必须是有效 TCP 端口');
  }

  // 使用 fetchImpl 便于测试；默认 fetchJson 仍保持 redirect=error 和超时边界。
  const getJson = fetchImpl === fetch
    ? (url) => fetchJson(url, timeoutMs)
    : async (url) => {
        const response = await fetchImpl(url, { redirect: 'error' });
        if (!response.ok) throw new CdpError('DISCOVERY_FAILED', `${url} 返回 ${response.status}`);
        return response.json();
      };

  if (expectedPid !== undefined && typeof getListeningPid === 'function') {
    const actualPid = await getListeningPid(port);
    if (actualPid !== expectedPid) {
      throw new CdpError('INVALID_TARGET', '调试端口监听 PID 不匹配', { actualPid, expectedPid });
    }
  }

  const base = `http://127.0.0.1:${port}`;
  const version = await getJson(`${base}/json/version`);
  const browserId = version.browserId || version.Browser || version.browser;
  if (expectedBrowserId && browserId !== expectedBrowserId) {
    throw new CdpError('INVALID_TARGET', 'Browser ID 不匹配', { browserId, expectedBrowserId });
  }

  const targets = await getJson(`${base}/json/list`);
  const target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  if (!target) throw new CdpError('TARGET_NOT_FOUND', '没有可用的 page target');
  assertLoopbackUrl(target.webSocketDebuggerUrl, port, target.id);

  return { version, browserId, target };
}

export function connectCdp(webSocketUrl, { port, targetId, timeoutMs = 5_000, WebSocketImpl = globalThis.WebSocket } = {}) {
  if (port && targetId) assertLoopbackUrl(webSocketUrl, port, targetId);
  if (typeof WebSocketImpl !== 'function') throw new TypeError('需要注入 WebSocket 实现');

  const socket = new WebSocketImpl(webSocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;
  let closed = false;

  function failAll(error) {
    if (closed) return;
    closed = true;
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(error);
    }
    pending.clear();
  }

  socket.addEventListener('message', (event) => {
    let message;
    try { message = JSON.parse(String(event.data)); } catch { return; }
    if (message.id !== undefined) {
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new CdpError('CDP_ERROR', message.error.message || 'CDP 命令失败', message.error));
      else item.resolve(message.result);
      return;
    }
    if (message.method) {
      for (const listener of listeners.get(message.method) || []) listener(message.params);
    }
  });
  socket.addEventListener('close', () => failAll(new CdpError('DISCONNECTED', 'CDP socket 已关闭')));
  socket.addEventListener('error', () => failAll(new CdpError('DISCONNECTED', 'CDP socket 发生错误')));

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new CdpError('TIMEOUT', 'CDP socket 连接超时')), timeoutMs);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new CdpError('DISCONNECTED', 'CDP socket 连接失败')); }, { once: true });
  });

  return {
    ready,
    send(method, params = {}) {
      if (closed) return Promise.reject(new CdpError('DISCONNECTED', 'CDP session 已关闭'));
      const id = ++nextId;
      return ready.then(() => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new CdpError('TIMEOUT', `CDP 命令超时：${method}`));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      }));
    },
    on(method, listener) {
      const set = listeners.get(method) || new Set();
      set.add(listener);
      listeners.set(method, set);
      return () => set.delete(listener);
    },
    close() {
      failAll(new CdpError('DISCONNECTED', 'CDP session 已关闭'));
      socket.close();
    },
  };
}

export async function installPageBridge(cdp, source, {
  bindingName = '__codexAppExtensionHost',
  handleRequest,
  allowedMethods = [],
} = {}) {
  if (typeof source !== 'string' || source.length === 0) throw new TypeError('source 必须是非空字符串');
  if (typeof handleRequest !== 'function') throw new TypeError('handleRequest 必须是函数');
  const methods = new Set(allowedMethods);
  const bindingLiteral = JSON.stringify(bindingName);
  const bridgeBootstrap = `
    (() => {
      const key = '__CODEX_APP_EXTENSION_HOST_BRIDGE__';
      window[key]?.dispose?.();
      const onMessage = (event) => {
        const data = event.data;
        if (event.source !== window || !data || data.source !== 'codex-app-extension') return;
        if (data.type !== 'CODEX_APP_EXTENSION_REQUEST') return;
        const binding = window[${bindingLiteral}];
        if (typeof binding !== 'function') return;
        binding(JSON.stringify(data));
      };
      window.addEventListener('message', onMessage);
      window[key] = { dispose: () => window.removeEventListener('message', onMessage) };
    })();
  `;
  const payload = `${bridgeBootstrap}\n${source}`;

  await cdp.ready;
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.addBinding', { name: bindingName });
  const early = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: payload });
  const current = await cdp.send('Runtime.evaluate', {
    expression: payload,
    awaitPromise: true,
    returnByValue: true,
  });
  if (current?.exceptionDetails) throw new CdpError('INJECTION_FAILED', '当前页面注入抛出异常', current.exceptionDetails);

  const removeBindingListener = cdp.on('Runtime.bindingCalled', async (params) => {
    if (params?.name !== bindingName) return;
    let request;
    let response;
    try {
      request = JSON.parse(params.payload);
      if (!request || request.type !== 'CODEX_APP_EXTENSION_REQUEST' || typeof request.requestId !== 'string') {
        throw new CdpError('INVALID_REQUEST', '页面 bridge 请求格式无效');
      }
      if (!methods.has(request.method)) {
        throw new CdpError('METHOD_NOT_ALLOWED', `禁止调用宿主方法：${request.method}`);
      }
      const result = await handleRequest(request.method, request.params || {});
      response = {
        source: 'codex-app-extension',
        type: 'CODEX_APP_EXTENSION_RESPONSE',
        requestId: request.requestId,
        ok: true,
        result,
      };
    } catch (error) {
      response = {
        source: 'codex-app-extension',
        type: 'CODEX_APP_EXTENSION_RESPONSE',
        requestId: request?.requestId || '',
        ok: false,
        error: {
          code: error?.code || 'HOST_ERROR',
          message: error?.message || '宿主处理失败',
        },
      };
    }

    const expression = `window.postMessage(${JSON.stringify(response)}, window.location.origin)`;
    await cdp.send('Runtime.evaluate', {
      expression,
      contextId: params.executionContextId,
      returnByValue: true,
    });
  });

  return {
    earlyScriptIdentifier: early?.identifier,
    bindingName,
    async dispose() {
      removeBindingListener();
      if (early?.identifier) {
        await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: early.identifier });
      }
    },
  };
}

export function startWatcher({ discover, reconnect, backoff = [250, 500, 1_000, 2_000, 4_000], signal } = {}) {
  if (typeof discover !== 'function' || typeof reconnect !== 'function') throw new TypeError('discover 和 reconnect 必须是函数');
  let stopped = false;
  let attempt = 0;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const run = (async () => {
    while (!stopped && !signal?.aborted) {
      try {
        const target = await discover();
        await reconnect(target);
        attempt = 0;
        await sleep(backoff[0] || 250);
      } catch (error) {
        if (stopped || signal?.aborted) break;
        const delay = backoff[Math.min(attempt++, backoff.length - 1)] || 2_000;
        await sleep(delay);
      }
    }
  })();

  return {
    done: run,
    stop() { stopped = true; },
  };
}
