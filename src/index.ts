import { loadHtml, loadFunction } from "./load/index";
import SandBox from "./sandbox/index";

(async () => {
  const htmlData = await loadHtml("http://localhost:5000");
  const sandBox1 = new SandBox("sandBox1", window);
  sandBox1.active();
  // const scripts = await loadFunction(htmlData.scriptSrc);
  // console.log(scripts[0]);

  const el = document.createElement("script");
  el.setAttribute(`type`, "module");
  el.src = htmlData.scriptSrc[0];
  const selector = document.querySelector("html");
  selector?.appendChild(el);
  setTimeout(() => {
    console.log(window.mount);
  }, 2000);
  // console.log(sandBox1.proxy.a);
})();
