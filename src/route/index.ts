export type listenCallback = (
  oldPathName: string,
  pathName: string,
  param: any
) => void;

/** 监听hash路由变化 */
function listenHash(callback: (oldUrl: string, newUrl: string) => void) {
  window.addEventListener('hashchange', (ev) => {
    callback(ev.oldURL, ev.newURL);
  });
}

/** 监听history路由变化 */
function listenHistory(callback: listenCallback) {
  window.history.pushState = historyControlRewrite('pushState', callback);
  window.history.replaceState = historyControlRewrite('replaceState', callback);
  window.addEventListener('popstate', (ev) => {
    console.log(ev);
  });
}

// 重写pushState方法
const historyControlRewrite = function (
  name: 'pushState' | 'replaceState',
  callback: listenCallback
) {
  const method = history[name];
  return function (data: any, unused: string, url: string) {
    const oldPathName = window.location.pathname;
    if (oldPathName === url) return;
    method.apply(history, [data, unused, url]);
    callback(oldPathName, url || '', data);
  };
};

/** 挂载路由监听器 */
export function loadRouterListen(callback: listenCallback) {
  listenHash((oldUrl, newUrl) => {
    console.log(oldUrl, newUrl);
  });
  listenHistory(callback);
}
