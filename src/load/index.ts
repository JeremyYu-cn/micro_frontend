import { PRODUCT_BY_MICRO_FRONTEND } from '../config/index';
import { RegisterData } from '../globalType';
import { loadRouterListen } from '../route/index';
import { addNewListener, createStore } from '../storage/index';
import { loadHtml, LoadHtmlResult } from './load';
import { runScript, unmountScript } from './run';

interface MicroFrountendMethod {
  init: () => void;
  setDefaultRoute: (routeName: string) => void;
  start: () => void;
}

export default class MicroFrountend implements MicroFrountendMethod {
  /** 微应用列表 */
  private servers: RegisterData[];
  /** 请求后的应用列表 */
  private serverLoadData: Record<string, LoadHtmlResult>;
  /** 当前路由 */
  public currentRoute: string;
  /** 当前开启的微应用容器 */
  public currentActiveContainer: string[];
  /** 全局store */
  public store: Record<string, any>;

  constructor(servers: RegisterData[]) {
    this.servers = servers;
    this.serverLoadData = {};
    this.currentRoute = '';
    this.currentActiveContainer = [];
    this.store = createStore();
  }

  /** 初始化 */
  public async init() {
    for (let item of this.servers) {
      const serverData = await loadHtml(item.entry);
      addNewListener(item.appName);
      this.serverLoadData[item.appName] = serverData;
    }

    return true;
  }

  /** 设置默认路由 */
  public setDefaultRoute(routeName: string) {
    const appIndex = this.servers.findIndex(
      (val) => val.activeRoute === routeName
    );
    if (appIndex === -1) return false;
    const appName = this.servers[appIndex].appName;
    const isInclude = Object.keys(this.serverLoadData).includes(appName);
    if (!isInclude) {
      return false;
    }

    this.currentRoute = routeName;
    return true;
  }

  /** 添加活动containerId */
  private appendCurrentActiveContainer(containerId: string) {
    const isAppend = this.currentActiveContainer.includes(containerId);
    if (!isAppend) {
      this.currentActiveContainer.push(containerId);
    }
  }

  private removeCurrentActiveContainer(containerId: string) {
    const index = this.currentActiveContainer.findIndex(
      (val) => val === containerId
    );
    if (index > -1) {
      this.currentActiveContainer.splice(index, 1);
    }
  }

  /** 开启加载微前端应用 */
  public async start() {
    loadRouterListen((oldPath, pathName, param) =>
      this.handleRouterListen(oldPath, pathName, param)
    );
    const currentRoute = this.currentRoute || window.location.pathname;
    console.log(window.location.pathname);
    const appList = this.servers.filter(
      (val) => val.activeRoute === currentRoute
    );
    for (let val of appList) {
      const appName = val.appName;
      const htmlData = this.serverLoadData[appName];
      const scriptResult = await runScript(val, htmlData, this.store);

      this.serverLoadData[appName].lifeCycle = scriptResult.lifeCycle;
      this.serverLoadData[appName].sandbox = scriptResult.sandBox;
    }
  }

  // 处理路由监听服务
  handleRouterListen(oldPathName: string, pathName: string, param: any) {
    console.log(param);

    if (param[PRODUCT_BY_MICRO_FRONTEND]) {
      const newAppList = this.servers.filter(
        (val) => val.activeRoute === pathName
      );
      console.log(oldPathName, pathName);

      // 卸载旧服务
      if (newAppList.length > 0) {
        for (let item of oldAppList) {
          if (this.currentActiveContainer.includes(item.containerId)) {
            const appName = item.appName;
            const container = document.querySelector(item.containerId);
            const loadData = this.serverLoadData[appName];
            if (container && loadData.lifeCycle && loadData.sandbox) {
              console.log(111, oldAppList);
              unmountScript(
                appName,
                container,
                loadData.lifeCycle,
                loadData.sandbox
              );
            }
          }
        }
      }

      // 挂载新服务
      for (let item of newAppList) {
        const newAppName = item.appName;

        if (item.activeRoute !== this.currentRoute) {
          this.setDefaultRoute(item.activeRoute);
          runScript(item, this.serverLoadData[newAppName], this.store);
        }
      }
    }
  }
}
