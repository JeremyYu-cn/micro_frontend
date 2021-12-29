(() => {
  // src/config/index.ts
  var PRODUCT_BY_MICRO_FRONTEND = "PRODUCT_BY_MICRO_FRONTEND";

  // src/route/index.ts
  function listenHash(callback) {
    window.addEventListener("hashchange", (ev) => {
      callback(getHashPathName(ev.oldURL), getHashPathName(ev.newURL), {});
    });
  }
  function getHashPathName(url) {
    const pathArr = url.split("#");
    return pathArr[1] ? `/${pathArr[1]}` : "/";
  }
  function listenHistory(callback, currentRoute) {
    window.history.pushState = historyControlRewrite("pushState", callback);
    window.history.replaceState = historyControlRewrite("replaceState", callback);
    window.addEventListener("popstate", (ev) => {
      callback(currentRoute, window.location.pathname, ev.state);
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
  function loadRouterListen(callback, currentRoute = "") {
    listenHash(callback);
    listenHistory(callback, currentRoute);
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
  function getStoreValue(target, key) {
    return target[key];
  }
  function clearEventTrigger(appName) {
    listener.set(appName, {});
  }

  // src/load/load.ts
  var scriptReg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
  var styleReg = /(?<=<link[^>]*href=['\"]?)[^'\"> ]*/g;
  var isHttp = /http(s)?:\/\//;
  async function loadHtml(entry, type) {
    const data = await fetch(entry, {
      method: "GET"
    });
    let text = await data.text();
    const scriptArr = text.match(scriptReg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    const styleArr = text.match(styleReg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    text = text.replace(/(<script.*><\/script>)/g, "");
    const scriptText = [];
    if (type === "webpack" && scriptArr) {
      for (const item of scriptArr) {
        let scriptFetch = await fetch(item, { method: "GET" });
        scriptText.push(await scriptFetch.text());
      }
    }
    return {
      entry,
      html: text,
      scriptSrc: type === "webpack" ? scriptText : scriptArr || [],
      styleSrc: styleArr || []
    };
  }
  function injectEnvironmentStr(context) {
    context[PRODUCT_BY_MICRO_FRONTEND] = true;
    context.__vite_plugin_react_preamble_installed__ = true;
    return true;
  }
  async function loadScriptByImport(scripts) {
    injectEnvironmentStr(window);
    let scriptStr = `
      return Promise.all([`;
    scripts.forEach((val) => {
      scriptStr += `import("${val}"),`;
    });
    scriptStr = scriptStr.substring(0, scriptStr.length - 1);
    scriptStr += `]);
  `;
    return await new Function(scriptStr)();
  }
  async function loadScriptByString(scripts, context) {
    const scriptArr = [];
    injectEnvironmentStr(context);
    scripts.forEach(async (val) => {
      scriptArr.push(await new Function(`
          return (window => {
            ${val}
            return window.middleVue;
          })(this)
    `).call(context));
    });
    return scriptArr;
  }
  async function loadFunction(context, scripts = [], type = "esbuild") {
    let result = {};
    if (type === "esbuild") {
      result = await loadScriptByImport(scripts);
    } else {
      result = await loadScriptByString(scripts, context);
    }
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
            target[key] = value;
          }
          return true;
        },
        get: (target, key) => {
          if (target[key]) {
            return target[key];
          } else {
            const value = context[key];
            if (typeof value === "function")
              return value.bind(context);
            return value;
          }
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
    const lifeCycle = await loadFunction(appSandBox.proxy, htmlData.scriptSrc, appData.type);
    if (!runIsRender[appData.appName]) {
      lifeCycle.beforeMount();
      container.innerHTML = htmlData.html || "";
    }
    lifeCycle.mount({
      container,
      store: {
        get: (key) => getStoreValue(globalStore[key], key),
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
    currentActiveApp;
    store;
    constructor(servers) {
      this.servers = servers;
      this.serverLoadData = {};
      this.currentRoute = "";
      this.currentActiveApp = [];
      this.store = createStore();
    }
    async init() {
      for (let item of this.servers) {
        const serverData = await loadHtml(item.entry, item.type);
        addNewListener(item.appName);
        this.serverLoadData[item.appName] = serverData;
      }
      return true;
    }
    setCurrentRoute(routeName) {
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
    appendCurrentActiveApp(appName) {
      const isAppend = this.currentActiveApp.includes(appName);
      if (!isAppend) {
        this.currentActiveApp.push(appName);
      }
    }
    removeCurrentActiveApp(appName) {
      const index = this.currentActiveApp.findIndex((val) => val === appName);
      if (index > -1) {
        this.currentActiveApp.splice(index, 1);
      }
    }
    getCurrentActiveContainer() {
      const containerList = [];
      this.currentActiveApp.forEach((val) => {
        const index = this.servers.findIndex((item) => item.appName === val);
        if (index > -1)
          containerList.push(this.servers[index]);
      });
      return containerList;
    }
    async start() {
      loadRouterListen((oldPath, pathName, param) => this.handleRouterListen(oldPath, pathName, param), this.currentRoute);
      const currentRoute = this.currentRoute || window.location.pathname;
      console.log(window.location.pathname);
      const appList = this.servers.filter((val) => val.activeRoute === currentRoute);
      for (let val of appList) {
        const appName = val.appName;
        const htmlData = this.serverLoadData[appName];
        const scriptResult = await runScript(val, htmlData, this.store);
        this.appendCurrentActiveApp(val.appName);
        this.serverLoadData[appName].lifeCycle = scriptResult.lifeCycle;
        this.serverLoadData[appName].sandbox = scriptResult.sandBox;
      }
    }
    async handleRouterListen(oldPathName, pathName, param) {
      if (oldPathName === pathName)
        return;
      if (param[PRODUCT_BY_MICRO_FRONTEND]) {
        const newAppList = this.servers.filter((val) => val.activeRoute === pathName);
        if (newAppList.length > 0) {
          const activeContainerList = this.getCurrentActiveContainer();
          const destoryList = activeContainerList.filter((val) => newAppList.findIndex((item) => item.appName !== val.appName) > -1);
          console.log(destoryList);
          for (let item of destoryList) {
            const appName = item.appName;
            const container = document.querySelector(item.containerId);
            const loadData = this.serverLoadData[appName];
            if (container && loadData.lifeCycle && loadData.sandbox) {
              this.removeCurrentActiveApp(item.appName);
              console.log("destoryAppName", appName);
              unmountScript(appName, container, loadData.lifeCycle, loadData.sandbox);
            }
          }
        }
        for (let item of newAppList) {
          const newAppName = item.appName;
          this.setCurrentRoute(item.activeRoute);
          this.appendCurrentActiveApp(item.appName);
          const scriptResult = await runScript(item, this.serverLoadData[newAppName], this.store);
          this.serverLoadData[item.appName].lifeCycle = scriptResult.lifeCycle;
          this.serverLoadData[item.appName].sandbox = scriptResult.sandBox;
        }
      }
    }
  };

  // src/index.ts
  (async () => {
    const appList = [
      {
        appName: "middleReact",
        entry: "http://localhost:3001",
        containerId: "#middle_background_react",
        activeRoute: "/",
        type: "esbuild"
      },
      {
        appName: "middleVue",
        entry: "http://localhost:7105",
        containerId: "#middle_background_vue",
        activeRoute: "/",
        type: "webpack"
      }
    ];
    const microService = new MicroFrountend(appList);
    await microService.init();
    await microService.start();
  })();
})();
