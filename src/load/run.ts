import type { RegisterData } from '../globalType';
import SandBox from '../sandbox/index';
import { LoadHtmlResult, loadFunction, LoadFunctionResult } from './index';

const runIsRender: Record<string, boolean> = {};

export async function runScript(
  appData: RegisterData,
  htmlData: LoadHtmlResult
) {
  const container = document.querySelector(appData.containerId);
  if (!container) {
    throw new Error(`container[${appData.containerId}] is not found`);
  }
  const appSandBox = new SandBox(appData.appName, window);
  appSandBox.active();
  const lifeCycle = await loadFunction(appSandBox.proxy, htmlData.scriptSrc);

  // 已经渲染过没必要重新渲染
  if (!runIsRender[appData.appName]) {
    /** 渲染前调用生命周期 */
    lifeCycle.beforeMount();

    // 注入子应用HTML
    container.innerHTML = htmlData.html || '';
  }

  // 调用子应用渲染函数
  lifeCycle.mount({
    container,
  });
}

/**  */
export function unmountScript(
  container: Element,
  lifeCycle: LoadFunctionResult
) {
  lifeCycle.unmount({ container });
}
