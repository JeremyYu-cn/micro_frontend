import { PRODUCT_BY_MICRO_FRONTEND } from '../config/index';
import type {
  LoadFunctionMountParam,
  UnloadFunctionParam,
} from '../globalType';
import SandBox from '../sandbox/index';

export type LoadHtmlResult = {
  entry: string;
  html?: string;
  scriptSrc: string[];
  styleSrc: string[];
  lifeCycle?: LoadFunctionResult;
  sandbox?: SandBox;
};

const scriptReg = /(?<=<script[^>]*src=['\"]?)[^'\"> ]*/g;
const styleReg = /(?<=<link[^>]*href=['\"]?)[^'\"> ]*/g;
const isHttp = /http(s)?:\/\//;

/** 加载HTML */
export async function loadHtml(entry: string): Promise<LoadHtmlResult> {
  const data = await fetch(entry, {
    method: 'GET',
  });
  let text = await data.text();
  const scriptArr = text
    .match(scriptReg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  const styleArr = text
    .match(styleReg)
    ?.filter((val) => val)
    .map((val) => (isHttp.test(val) ? val : `${entry}${val}`));
  text = text.replace(/(<script.*><\/script>)/g, '');
  return {
    entry,
    html: text,
    scriptSrc: scriptArr || [],
    styleSrc: styleArr || [],
  };
}

/** 生命周期函数 */
export type LoadFunctionResult = {
  beforeMount: () => void;
  mount: (props: LoadFunctionMountParam) => void;
  unmount: (props: UnloadFunctionParam) => void;
};

/** 注入环境变量 */
function injectEnvironmentStr() {
  return `
      window.${PRODUCT_BY_MICRO_FRONTEND} = true;
      window.__vite_plugin_react_preamble_installed__ = true;
  `;
}

/** 加载JS文件 */
export async function loadFunction<T extends LoadFunctionResult>(
  context: Window,
  scripts: string[] = []
): Promise<T> {
  let scriptStr = `
    ${injectEnvironmentStr()}
    return (async function(window) {
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
