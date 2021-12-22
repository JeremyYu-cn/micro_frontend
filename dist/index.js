(() => {
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

  // src/config/index.ts
  var PRODUCT_BY_MICRO_FRONTEND = "PRODUCT_BY_MICRO_FRONTEND";

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
  `;
  }
  async function loadFunction(context, scripts = []) {
    let scriptStr = `
    return (function(window) {
      ${injectEnvironmentStr()}
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
  }

  // src/load/index.ts
  var MicroFrountend = class {
    servers;
    serverLoadData;
    defaultRoute;
    constructor(servers) {
      this.servers = servers;
      this.serverLoadData = {};
      this.defaultRoute = "";
    }
    async init() {
      for (let item of this.servers) {
        const serverData = await loadHtml(item.entry);
        addNewListener(item.appName);
        this.serverLoadData[item.appName] = serverData;
      }
      if (this.servers.length) {
        this.defaultRoute = this.servers[0].activeRoute;
      }
      return true;
    }
    async setDefaultRoute(routeName) {
      const isInclude = Object.keys(this.serverLoadData).includes(routeName);
      if (!isInclude) {
        return false;
      }
      this.defaultRoute = routeName;
      return true;
    }
    async start() {
      const appIndex = this.servers.findIndex((val) => val.activeRoute === this.defaultRoute);
      if (appIndex == -1) {
        console.warn("route is not found");
        return false;
      }
      const appName = this.servers[appIndex].appName;
      const htmlData = this.serverLoadData[appName];
      const store = createStore();
      await runScript(this.servers[appIndex], htmlData, store);
    }
  };

  // src/index.ts
  (async () => {
    const appList = [
      {
        appName: "middleBackground",
        entry: "http://localhost:3000",
        containerId: "#middle_background",
        activeRoute: "/vue"
      }
    ];
    const microService = new MicroFrountend(appList);
    await microService.init();
    await microService.start();
  })();
})();
