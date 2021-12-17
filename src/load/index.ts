type LoadHtmlResult = {
  entry: string;
  html?: string;
  scriptSrc: string[];
};

/** 加载HTML */
async function loadHtml(entry: string) {
  const data = await fetch(entry, {
    method: 'GET',
  });
  const text = await data.text();
  const reg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
  const isHttp = /http(s)?:\/\//;
  const scriptArr = text
    .match(reg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  console.log(scriptArr);
  return scriptArr;
}

/** 加载JS文件 */
async function loadFunction() {}

export default loadHtml;
