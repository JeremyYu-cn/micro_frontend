export type listenCallback = (
  oldPathName: string,
  pathName: string,
  param: any
) => void;

/** 监听hash路由变化 */
function listenHash(callback: listenCallback) {
  window.addEventListener('hashchange', (ev) => {
    callback(getHashPathName(ev.oldURL), getHashPathName(ev.newURL), {});
  });
}

function getHashPathName(url: string) {
  const pathArr = url.split('#');
  return pathArr[1] ? `/${pathArr[1]}` : '/';
}

/** 监听history路由变化 */
function listenHistory(callback: listenCallback, currentRoute: string) {
  window.history.pushState = historyControlRewrite('pushState', callback);
  window.history.replaceState = historyControlRewrite('replaceState', callback);
  window.addEventListener('popstate', (ev) => {
    callback(currentRoute, window.location.pathname, ev.state);
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
export function loadRouterListen(
  callback: listenCallback,
  currentRoute: string = ''
) {
  listenHash(callback);
  listenHistory(callback, currentRoute);
}
