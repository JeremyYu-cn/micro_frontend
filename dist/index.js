(() => {
  // src/load/index.ts
  async function loadHtml(entry) {
    const data = await fetch(entry, {
      method: "GET"
    });
    const text = await data.text();
    const reg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
    const isHttp = /http(s)?:\/\//;
    const scriptArr = text.match(reg)?.filter((val) => val).map((val) => isHttp.test(val) ? val : `${entry}${val}`);
    return {
      entry,
      html: text,
      scriptSrc: scriptArr || []
    };
  }
  function injectEnvironmentStr() {
    return `
    console.log(this.a)
    window = this;
    window.PRODUCT_BY_MICRO_FROUNTEND = true;
  `;
  }
  async function loadFunction(context, scripts = []) {
    let scriptStr = `
    ${injectEnvironmentStr()}
    return Promise.all([`;
    scripts.forEach((val) => {
      scriptStr += `import("${val}"),`;
    });
    scriptStr = scriptStr.substring(0, scriptStr.length - 1);
    scriptStr += "]);";
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
            console.log(key, value);
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

  // src/index.ts
  (async () => {
    const htmlData = await loadHtml("http://localhost:3000");
    const sandBox1 = new sandbox_default("sandBox1", window);
    sandBox1.active();
    const { mount } = await loadFunction(sandBox1.proxy, htmlData.scriptSrc);
  })();
})();
