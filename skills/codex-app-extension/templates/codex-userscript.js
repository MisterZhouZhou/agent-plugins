(function installCodexAppExtension(window) {
  'use strict';

  const GLOBAL_KEY = 'codexAppExtension';
  const REQUEST_TYPE = 'CODEX_APP_EXTENSION_REQUEST';
  const RESPONSE_TYPE = 'CODEX_APP_EXTENSION_RESPONSE';
  const SOURCE = 'codex-app-extension';
  const VERSION = '1.0.0';
  const old = window[GLOBAL_KEY];

  // 重复注入、热更新或页面重载时，先释放旧监听器和 pending Promise。
  old?.dispose?.();

  const pending = new Map();
  let sequence = 0;

  function requestId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    sequence += 1;
    return `${Date.now().toString(36)}-${sequence.toString(36)}`;
  }

  function onMessage(event) {
    if (event.source !== window || !event.data || event.data.source !== SOURCE) return;
    if (event.data.type !== RESPONSE_TYPE) return;

    const { requestId: id, ok, result, error } = event.data;
    const item = pending.get(id);
    if (!item) return;
    pending.delete(id);
    clearTimeout(item.timer);

    if (ok) item.resolve(result);
    else item.reject(Object.assign(new Error(error?.message || '宿主请求失败'), {
      code: error?.code || 'HOST_ERROR',
      details: error?.details,
    }));
  }

  window.addEventListener('message', onMessage);

  function request(method, params = {}, { timeoutMs = 10_000 } = {}) {
    if (typeof method !== 'string' || method.length === 0) {
      return Promise.reject(new TypeError('method 必须是非空字符串'));
    }

    const id = requestId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(Object.assign(new Error(`请求超时：${method}`), { code: 'TIMEOUT' }));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      window.postMessage({
        source: SOURCE,
        type: REQUEST_TYPE,
        requestId: id,
        method,
        params,
      }, window.location.origin);
    });
  }

  function dispose() {
    window.removeEventListener('message', onMessage);
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(Object.assign(new Error('扩展已清理'), { code: 'DISPOSED' }));
    }
    pending.clear();
    if (window[GLOBAL_KEY]?.version === VERSION) delete window[GLOBAL_KEY];
  }

  window[GLOBAL_KEY] = Object.freeze({
    version: VERSION,
    request,
    dispose,
  });
})(window);
