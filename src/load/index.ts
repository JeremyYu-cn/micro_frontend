type LoadHtmlResult = {
  entry: string;
  html?: string;
  scriptSrc: string[];
};

/** 加载HTML */
export async function loadHtml(entry: string): Promise<LoadHtmlResult> {
  const data = await fetch(entry, {
    method: "GET",
  });
  const text = await data.text();
  const reg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
  const isHttp = /http(s)?:\/\//;
  const scriptArr = text
    .match(reg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  console.log(scriptArr);
  return {
    entry,
    html: text,
    scriptSrc: scriptArr || [],
  };
}

/** 加载JS文件 */
export async function loadFunction(scripts: string[]) {
  const task: Promise<Response>[] = [];
  scripts.forEach((val) => {
    task.push(fetch(val));
  });
  const result = await Promise.all(task);
  const scriptArr: string[] = [];
  for (let x of result) {
    scriptArr.push(await x.text());
  }
  return scriptArr;
}
