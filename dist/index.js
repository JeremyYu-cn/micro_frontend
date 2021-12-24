(() => {
  // src/config/index.ts
  var PRODUCT_BY_MICRO_FRONTEND = "PRODUCT_BY_MICRO_FRONTEND";

  // src/route/index.ts
  function listenHash(callback) {
    window.addEventListener("hashchange", (ev) => {
      callback(ev.oldURL, ev.newURL);
    });
  }
  function listenHistory(callback) {
    window.history.pushState = historyControlRewrite("pushState", callback);
    window.history.replaceState = historyControlRewrite("replaceState", callback);
    window.addEventListener("popstate", (ev) => {
      console.log(ev);
    });
  }
  var historyControlRewrite = function(name, callback) {
    const method = history[name];
    return function(data, unused, url) {
      const oldPathName = window.location.pathname;
      if (oldPathName === url)
        return;
      method.apply(history, [data, unused, url]);
      callback(oldPathName, url || "", data);
    };
  };
  function loadRouterListen(callback) {
    listenHash((oldUrl, newUrl) => {
      console.log(oldUrl, newUrl);
    });
    listenHistory(callback);
  }

  // src/storage/index.ts
  function createStore() {
    const globalStore = new Proxy({}, {
      get(target, key) {
        return target[key];
      },
      set(target, key, value) {
        const oldVal = target[key];
        target[key] = value;
        triggerEvent({ key, value, oldValue: oldVal });
        return true;
      }
    });
    return globalStore;
  }
  var listener = /* @__PURE__ */ new Map();
  function addNewListener(appName) {
    if (listener.has(appName))
      return;
    listener.set(appName, {});
  }
  function triggerEvent(data) {
    listener.forEach((val) => {
      if (val[data.key] && typeof val[data.key] === "function") {
        val[data.key](data);
      }
    });
  }
  function setEventTrigger(appName, key, callback) {
    if (listener.has(appName)) {
      const obj = listener.get(appName);
      if (obj) {
        obj[key] = callback;
      }
    }
  }
  function setStoreValue(target, key, value) {
    target[key] = value;
    return true;
  }
  function clearEventTrigger(appName) {
    listener.set(appName, {});
  }

  // src/load/load.ts
  var scriptReg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
  var styleReg = /(?<=<link[^>]*href=['\"]?)[^'\"> ]*/g;
  var isHttp = /http(s)?:\/\//;
  async function loadHtml(entry) {
    const data = await fetch(entry, {
      method: "GET"
    });
    let text = await data.text();
    const scriptArr = text.match(scriptReg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    const styleArr = text.match(styleReg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    text = text.replace(/(<script.*><\/script>)/g, "");
    return {
      entry,
      html: text,
      scriptSrc: scriptArr || [],
      styleSrc: styleArr || []
    };
  }
  function injectEnvironmentStr() {
    return `
      window.${PRODUCT_BY_MICRO_FRONTEND} = true;
      window.__vite_plugin_react_preamble_installed__ = true;
  `;
  }
  async function loadFunction(context, scripts = []) {
    let scriptStr = `
    ${injectEnvironmentStr()}
    return (async function(window) {
      return Promise.all([`;
    scripts.forEach((val) => {
      scriptStr += `import("${val}"),`;
    });
    scriptStr = scriptStr.substring(0, scriptStr.length - 1);
    scriptStr += `]);
    })(this)
  `;
    const result = await new Function(scriptStr).call(context);
    let obj = {
      beforeMount: () => {
      },
      mount: () => {
      },
      unmount: () => {
      }
    };
    result.forEach((val) => {
      Object.assign(obj, val);
    });
    return obj;
  }

  // src/sandbox/index.ts
  var SandBox = class {
    proxy;
    isSandboxActive;
    name;
    active() {
      this.isSandboxActive = true;
    }
    inActive() {
      this.isSandboxActive = false;
    }
    constructor(appName, context) {
      this.name = appName;
      this.isSandboxActive = false;
      const fateWindow = {};
      this.proxy = new Proxy(fateWindow, {
        set: (target, key, value) => {
          if (this.isSandboxActive) {
            if (Object.keys(context).includes(key)) {
              context[key] = value;
            }
            target[key] = value;
          }
          return true;
        },
        get: (target, key) => {
          if (target[key]) {
            return target[key];
          } else if (Object.keys(context).includes(key)) {
            return context[key];
          }
          return void 0;
        }
      });
    }
  };
  var sandbox_default = SandBox;

  // src/load/run.ts
  var runIsRender = {};
  async function runScript(appData, htmlData, globalStore) {
    const container = document.querySelector(appData.containerId);
    if (!container) {
      throw new Error(`container[${appData.containerId}] is not found`);
    }
    const appSandBox = new sandbox_default(appData.appName, window);
    appSandBox.active();
    const lifeCycle = await loadFunction(appSandBox.proxy, htmlData.scriptSrc);
    if (!runIsRender[appData.appName]) {
      lifeCycle.beforeMount();
      container.innerHTML = htmlData.html || "";
    }
    lifeCycle.mount({
      container,
      store: {
        get: (key) => globalStore[key],
        set: (key, value) => setStoreValue(globalStore, key, value),
        listen: ({ key, callback }) => setEventTrigger(appData.appName, key, callback)
      }
    });
    return {
      sandBox: appSandBox,
      lifeCycle
    };
  }
  function unmountScript(appName, container, lifeCycle, sandBox) {
    clearEventTrigger(appName);
    sandBox.inActive();
    lifeCycle.unmount({ container });
  }

  // src/load/index.ts
  var MicroFrountend = class {
    servers;
    serverLoadData;
    currentRoute;
    currentActiveContainer;
    store;
    constructor(servers) {
      this.servers = servers;
      this.serverLoadData = {};
      this.currentRoute = "";
      this.currentActiveContainer = [];
      this.store = createStore();
    }
    async init() {
      for (let item of this.servers) {
        const serverData = await loadHtml(item.entry);
        addNewListener(item.appName);
        this.serverLoadData[item.appName] = serverData;
      }
      return true;
    }
    setDefaultRoute(routeName) {
      const appIndex = this.servers.findIndex((val) => val.activeRoute === routeName);
      if (appIndex === -1)
        return false;
      const appName = this.servers[appIndex].appName;
      const isInclude = Object.keys(this.serverLoadData).includes(appName);
      if (!isInclude) {
        return false;
      }
      this.currentRoute = routeName;
      return true;
    }
    appendCurrentActiveContainer(containerId) {
      const isAppend = this.currentActiveContainer.includes(containerId);
      if (!isAppend) {
        this.currentActiveContainer.push(containerId);
      }
    }
    removeCurrentActiveContainer(containerId) {
      const index = this.currentActiveContainer.findIndex((val) => val === containerId);
      if (index > -1) {
        this.currentActiveContainer.splice(index, 1);
      }
    }
    async start() {
      loadRouterListen((oldPath, pathName, param) => this.handleRouterListen(oldPath, pathName, param));
      const currentRoute = this.currentRoute || window.location.pathname;
      console.log(window.location.pathname);
      const appList = this.servers.filter((val) => val.activeRoute === currentRoute);
      for (let val of appList) {
        const appName = val.appName;
        const htmlData = this.serverLoadData[appName];
        const scriptResult = await runScript(val, htmlData, this.store);
        this.serverLoadData[appName].lifeCycle = scriptResult.lifeCycle;
        this.serverLoadData[appName].sandbox = scriptResult.sandBox;
      }
    }
    handleRouterListen(oldPathName, pathName, param) {
      console.log(param);
      if (param[PRODUCT_BY_MICRO_FRONTEND]) {
        const newAppList = this.servers.filter((val) => val.activeRoute === pathName);
        console.log(oldPathName, pathName);
        if (newAppList.length > 0) {
          for (let item of oldAppList) {
            if (this.currentActiveContainer.includes(item.containerId)) {
              const appName = item.appName;
              const container = document.querySelector(item.containerId);
              const loadData = this.serverLoadData[appName];
              if (container && loadData.lifeCycle && loadData.sandbox) {
                console.log(111, oldAppList);
                unmountScript(appName, container, loadData.lifeCycle, loadData.sandbox);
              }
            }
          }
        }
        for (let item of newAppList) {
          const newAppName = item.appName;
          if (item.activeRoute !== this.currentRoute) {
            this.setDefaultRoute(item.activeRoute);
            runScript(item, this.serverLoadData[newAppName], this.store);
          }
        }
      }
    }
  };

  // src/index.ts
  (async () => {
    const appList = [
      {
        appName: "middleReact",
        entry: "http://localhost:3000",
        containerId: "#middle_background_react",
        activeRoute: "/"
      },
      {
        appName: "middleBackground",
        entry: "http://localhost:3001",
        containerId: "#middle_background_vue",
        activeRoute: "/vue"
      }
    ];
    const microService = new MicroFrountend(appList);
    await microService.init();
    await microService.start();
  })();
})();
