import { PRODUCT_BY_MICRO_FRONTEND } from '../config/index';
import { LoadFunctionMountParam } from '../globalType';

export type LoadHtmlResult = {
  entry: string;
  html?: string;
  scriptSrc: string[];
  styleSrc: string[];
};

/** 加载HTML */
export async function loadHtml(entry: string): Promise<LoadHtmlResult> {
  const data = await fetch(entry, {
    method: 'GET',
  });
  let text = await data.text();
  const reg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
  const styleReg = /(?<=<link[^>]*href=['\"]?)[^'\"> ]*/g;
  const isHttp = /http(s)?:\/\//;
  const scriptArr = text
    .match(reg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  const styleArr = text
    .match(styleReg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  console.log(styleArr);
  text = text.replace(/(<script.*><\/script>)/g, '');
  return {
    entry,
    html: text,
    scriptSrc: scriptArr || [],
    styleSrc: styleArr || [],
  };
}

export type LoadFunctionResult = {
  beforeMount: () => void;
  mount: (props: LoadFunctionMountParam) => void;
  unmount: (props: LoadFunctionMountParam) => void;
};

/** 注入环境变量 */
function injectEnvironmentStr() {
  return `
      window.${PRODUCT_BY_MICRO_FRONTEND} = true;
  `;
}

/** 加载JS文件 */
export async function loadFunction<T extends LoadFunctionResult>(
  context: Window,
  scripts: string[] = []
): Promise<T> {
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
