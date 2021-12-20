import { loadHtml, loadFunction } from "./load/index";
import SandBox from "./sandbox/index";

(async () => {
  const htmlData = await loadHtml("http://localhost:3000");
  const sandBox1 = new SandBox("sandBox1", window);
  sandBox1.active();
  const { mount } = await loadFunction(sandBox1.proxy, htmlData.scriptSrc);
  // mount({});
  // console.log(window.PRODUCT_BY_MICRO_FROUNTEND);
})();
