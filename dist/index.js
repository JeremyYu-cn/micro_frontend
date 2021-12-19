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
    console.log(scriptArr);
    return {
      entry,
      html: text,
      scriptSrc: scriptArr || []
    };
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
      const fateWindow = /* @__PURE__ */ new Map();
      this.proxy = new Proxy(fateWindow, {
        set: (target, key, value) => {
          if (this.isSandboxActive) {
            if (Object.keys(this.name).includes(key)) {
              context[key] = value;
            }
            target.set(key, value);
          }
          return true;
        },
        get: (target, key) => {
          if (target.has(key)) {
            return target.get(key);
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
    const htmlData = await loadHtml("http://localhost:5000");
    const sandBox1 = new sandbox_default("sandBox1", window);
    sandBox1.active();
    const el = document.createElement("script");
    el.setAttribute(`type`, "module");
    el.src = htmlData.scriptSrc[0];
    const selector = document.querySelector("html");
    selector?.appendChild(el);
    setTimeout(() => {
      console.log(window.mount);
    }, 2e3);
  })();
})();
