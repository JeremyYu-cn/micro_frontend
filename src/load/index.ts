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
  return {
    entry,
    html: text,
    scriptSrc: scriptArr || [],
  };
}

type LoadFunctionResult = {
  beforeMount: () => void;
  mount: (props: Record<string, any>) => void;
  unmount: (props: Record<string, any>) => void;
};

function injectEnvironmentStr() {
  return `
    console.log(this.a)
    window = this;
    window.PRODUCT_BY_MICRO_FROUNTEND = true;
  `;
}

/** 加载JS文件 */
export async function loadFunction<T extends LoadFunctionResult>(
  context: Window,
  scripts: string[] = []
): Promise<T> {
  let scriptStr = `
    ${injectEnvironmentStr()}
    return Promise.all([`;
  scripts.forEach((val) => {
    scriptStr += `import("${val}"),`;
  });
  scriptStr = scriptStr.substring(0, scriptStr.length - 1);
  scriptStr += "]);";
  const result = await new Function(scriptStr).call(context);
  let obj: LoadFunctionResult = {
    beforeMount: () => {},
    mount: () => {},
    unmount: () => {},
  };
  (<Record<string, any>[]>result).forEach((val) => {
    Object.assign(obj, val);
  });
  return <T>obj;
}
