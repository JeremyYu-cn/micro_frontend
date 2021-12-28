import type { RegisterData } from '../globalType';
import SandBox from '../sandbox/index';
import {
  clearEventTrigger,
  getStoreValue,
  setEventTrigger,
  setStoreValue,
} from '../storage/index';
import { LoadHtmlResult, loadFunction, LoadFunctionResult } from './load';

const runIsRender: Record<string, boolean> = {};

export async function runScript(
  appData: RegisterData,
  htmlData: LoadHtmlResult,
  globalStore: Record<string, any>
) {
  const container = document.querySelector(appData.containerId);
  if (!container) {
    throw new Error(`container[${appData.containerId}] is not found`);
  }
  const appSandBox = new SandBox(appData.appName, window);
  appSandBox.active();

  const lifeCycle = await loadFunction(
    appSandBox.proxy,
    htmlData.scriptSrc,
    appData.type
  );

  // 已经渲染过没必要重新载入
  if (!runIsRender[appData.appName]) {
    /** 渲染前调用生命周期 */
    lifeCycle.beforeMount();

    // 注入子应用HTML
    container.innerHTML = htmlData.html || '';
  }

  // 调用子应用渲染函数
  lifeCycle.mount({
    container,
    store: {
      get: (key) => getStoreValue(globalStore[key], key),
      set: (key, value) => setStoreValue(globalStore, key, value),
      listen: ({ key, callback }) =>
        setEventTrigger(appData.appName, key, callback),
    },
  });
  return {
    sandBox: appSandBox,
    lifeCycle,
  };
}

/** 卸载应用 */
export function unmountScript(
  appName: string,
  container: Element,
  lifeCycle: LoadFunctionResult,
  sandBox: SandBox
) {
  clearEventTrigger(appName);
  sandBox.inActive();
  lifeCycle.unmount({ container });
}
