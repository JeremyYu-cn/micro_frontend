import { PRODUCT_BY_MICRO_FRONTEND } from '../config/index';
import type {
  LoadFunctionMountParam,
  UnloadFunctionParam,
} from '../globalType';
import SandBox, { ProxyParam } from '../sandbox/index';

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
export async function loadHtml(
  entry: string,
  type: LoadScriptType
): Promise<LoadHtmlResult> {
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
  const scriptText: string[] = [];
  if (type === 'string' && scriptArr) {
    for (const item of scriptArr) {
      let scriptFetch = await fetch(item, { method: 'GET' });
      scriptText.push(await scriptFetch.text());
    }
  }

  return {
    entry,
    html: text,
    scriptSrc: type === 'string' ? scriptText : scriptArr || [],
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
export function injectEnvironmentStr(context: ProxyParam) {
  context[PRODUCT_BY_MICRO_FRONTEND] = true;
  context.__vite_plugin_react_preamble_installed__ = true;
  return true;
}

/** 使用import加载script */
export async function loadScriptByImport(scripts: string[]) {
  injectEnvironmentStr(window);
  let scriptStr = `
    return ((window) => {
      return Promise.all([`;
  scripts.forEach((val) => {
    scriptStr += `import("${val}"),`;
  });
  scriptStr = scriptStr.substring(0, scriptStr.length - 1);
  scriptStr += `]);
    })(this)
  `;
  return await new Function(scriptStr)();
}

export type LoadScriptType = 'import' | 'string';

/** 执行js字符串 */
export async function loadScriptByString(scripts: string[], context: Window) {
  const scriptArr: Promise<Record<string, any>>[] = [];
  injectEnvironmentStr(window);
  console.log(scripts);

  scripts.forEach(async (val) => {
    scriptArr.push(
      await new Function(`
          ${val}
          return window;
    `).call(context, context)
    );
  });

  return scriptArr;
}

/** 加载JS文件 */
export async function loadFunction<T extends LoadFunctionResult>(
  context: Window,
  scripts: string[] = [],
  type: LoadScriptType = 'import'
): Promise<T> {
  let result = {};
  if (type === 'import') {
    result = await loadScriptByImport(scripts);
  } else {
    result = await loadScriptByString(scripts, context);
  }

  let obj: LoadFunctionResult = {
    beforeMount: () => {},
    mount: () => {},
    unmount: () => {},
  };
  (<Record<string, any>[]>result).forEach((val) => {
    Object.assign(obj, val);
  });

  console.log(obj.mount);
  return <T>obj;
}
