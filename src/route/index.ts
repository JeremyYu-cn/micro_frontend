/** 监听hash路由变化 */
export function listenHash() {
  window.addEventListener('hashchange', (ev) => {
    ev.newURL;
  });
}

/** 监听history路由变化 */
export function listenHistory() {
  window.addEventListener('popstate', (ev) => {
    console.log(ev);
  });
}
