(() => {
  // src/config/index.ts
  var PRODUCT_BY_MICRO_FRONTEND = "PRODUCT_BY_MICRO_FRONTEND";

  // src/load/index.ts
  async function loadHtml(entry) {
    const data = await fetch(entry, {
      method: "GET"
    });
    let text = await data.text();
    const reg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
    const styleReg = /(?<=<link[^>]*href=['\"]?)[^'\"> ]*/g;
    const isHttp = /http(s)?:\/\//;
    const scriptArr = text.match(reg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    const styleArr = text.match(styleReg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    console.log(styleArr);
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
  async function runScript(appData, htmlData) {
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
      container
    });
  }

  // src/index.ts
  (async () => {
    const htmlData = await loadHtml("http://localhost:3000");
    const appData = {
      appName: "middleBackground",
      entry: "http://localhost:3000",
      containerId: "#middle_background",
      activeRoute: "/vue"
    };
    runScript(appData, htmlData);
  })();
})();
