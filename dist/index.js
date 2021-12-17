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
    return scriptArr;
  }
  var load_default = loadHtml;

  // src/index.ts
  var test = 1;
  console.log(test);
  load_default("http://localhost:7101");
})();
