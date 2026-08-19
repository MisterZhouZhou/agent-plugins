/**
 * Codex App Server 宿主侧最小客户端模板。
 *
 * request 的约定：request(method, params, { signal }) => Promise<unknown>。
 * 它可以由 HTTP、stdio 或已有 App Server transport 实现；本模板不决定传输层。
 */

const DEFAULT_ALLOWED_METHODS = [
  'thread/read',
  'automation/create',
  'automation/update',
  'automation/pause',
];

export class AppServerClientError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'AppServerClientError';
    this.code = code;
    this.details = details;
  }
}

function assertRecord(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppServerClientError('INVALID_PARAMS', `${name} 必须是对象`);
  }
}

function assertId(value, name) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    throw new AppServerClientError('INVALID_PARAMS', `${name} 必须是 1-256 个字符的字符串`);
  }
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new AppServerClientError('TIMEOUT', `${label} 超时`));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    clearTimeout(timer);
  });
}

export function createAppServerClient({
  request,
  allowedMethods = DEFAULT_ALLOWED_METHODS,
  timeoutMs = 10_000,
} = {}) {
  if (typeof request !== 'function') {
    throw new TypeError('request 必须是函数');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('timeoutMs 必须是正数');
  }

  const methods = new Set(allowedMethods);

  async function call(method, params = {}) {
    if (typeof method !== 'string' || !methods.has(method)) {
      throw new AppServerClientError('METHOD_NOT_ALLOWED', `禁止调用 App Server 方法：${method}`);
    }
    assertRecord(params, 'params');

    try {
      return await withTimeout(
        request(method, params, { timeoutMs }),
        timeoutMs,
        method,
      );
    } catch (error) {
      if (error instanceof AppServerClientError) throw error;
      throw new AppServerClientError('RPC_ERROR', error?.message || 'App Server 请求失败', error);
    }
  }

  return {
    call,

    readThread(threadId) {
      assertId(threadId, 'threadId');
      return call('thread/read', { threadId });
    },

    createAutomation(spec) {
      assertRecord(spec, 'automation spec');
      if (typeof spec.prompt !== 'string' || spec.prompt.length === 0 || spec.prompt.length > 20_000) {
        throw new AppServerClientError('INVALID_PARAMS', 'automation.prompt 必须是非空字符串');
      }
      if (typeof spec.cron !== 'string' || spec.cron.length === 0 || spec.cron.length > 256) {
        throw new AppServerClientError('INVALID_PARAMS', 'automation.cron 必须是非空字符串');
      }
      return call('automation/create', spec);
    },

    updateAutomation(automationId, patch) {
      assertId(automationId, 'automationId');
      assertRecord(patch, 'automation patch');
      return call('automation/update', { automationId, ...patch });
    },

    pauseAutomation(automationId, paused = true) {
      assertId(automationId, 'automationId');
      if (typeof paused !== 'boolean') {
        throw new AppServerClientError('INVALID_PARAMS', 'paused 必须是布尔值');
      }
      return call('automation/pause', { automationId, paused });
    },
  };
}

// 示例：把宿主 transport 注入后再创建客户端。
// const client = createAppServerClient({ request: transport.request });
