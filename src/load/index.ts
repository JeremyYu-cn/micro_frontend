import { PRODUCT_BY_MICRO_FRONTEND } from '../config/index';
import { RegisterData } from '../globalType';
import { loadRouterListen } from '../route/index';
import { addNewListener, createStore } from '../storage/index';
import { loadHtml, LoadHtmlResult } from './load';
import { runScript, unmountScript } from './run';

interface MicroFrountendMethod {
  init: () => void;
  setCurrentRoute: (routeName: string) => void;
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
  public currentActiveApp: string[];
  /** 全局store */
  public store: Record<string, any>;

  constructor(servers: RegisterData[]) {
    this.servers = servers;
    this.serverLoadData = {};
    this.currentRoute = '';
    this.currentActiveApp = [];
    this.store = createStore();
  }

  /** 初始化 */
  public async init() {
    for (let item of this.servers) {
      const serverData = await loadHtml(item.entry, item.type);
      addNewListener(item.appName);
      this.serverLoadData[item.appName] = serverData;
    }

    return true;
  }

  /** 设置路由 */
  public setCurrentRoute(routeName: string) {
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
  private appendCurrentActiveApp(appName: string) {
    const isAppend = this.currentActiveApp.includes(appName);
    if (!isAppend) {
      this.currentActiveApp.push(appName);
    }
  }

  /** 删除活动containerId */
  private removeCurrentActiveApp(appName: string) {
    const index = this.currentActiveApp.findIndex((val) => val === appName);
    if (index > -1) {
      this.currentActiveApp.splice(index, 1);
    }
  }

  // 获取当前正在使用的容器
  private getCurrentActiveContainer() {
    const containerList: RegisterData[] = [];
    this.currentActiveApp.forEach((val) => {
      const index = this.servers.findIndex((item) => item.appName === val);
      if (index > -1) containerList.push(this.servers[index]);
    });
    return containerList;
  }

  /** 开启加载微前端应用 */
  public async start() {
    loadRouterListen(
      (oldPath, pathName, param) =>
        this.handleRouterListen(oldPath, pathName, param),
      this.currentRoute
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
      this.appendCurrentActiveApp(val.appName);
      this.serverLoadData[appName].lifeCycle = scriptResult.lifeCycle;
      this.serverLoadData[appName].sandbox = scriptResult.sandBox;
    }
  }

  // 处理路由监听服务
  private async handleRouterListen(
    oldPathName: string,
    pathName: string,
    param: any
  ) {
    if (param[PRODUCT_BY_MICRO_FRONTEND]) {
      // 匹配路径名的所有应用
      const newAppList = this.servers.filter(
        (val) => val.activeRoute === pathName
      );

      // 卸载旧服务
      if (newAppList.length > 0) {
        const activeContainerList = this.getCurrentActiveContainer();
        const destoryList = activeContainerList.filter(
          (val) =>
            newAppList.findIndex((item) => item.appName !== val.appName) > -1
        );

        for (let item of destoryList) {
          const appName = item.appName;
          const container = document.querySelector(item.containerId);
          const loadData = this.serverLoadData[appName];

          if (container && loadData.lifeCycle && loadData.sandbox) {
            this.removeCurrentActiveApp(item.appName);
            console.log('destoryAppName', appName);

            unmountScript(
              appName,
              container,
              loadData.lifeCycle,
              loadData.sandbox
            );
          }
        }
      }

      // 挂载新服务
      for (let item of newAppList) {
        const newAppName = item.appName;
        if (item.activeRoute !== this.currentRoute) {
          this.setCurrentRoute(item.activeRoute);
          this.appendCurrentActiveApp(item.appName);
          const scriptResult = await runScript(
            item,
            this.serverLoadData[newAppName],
            this.store
          );
          this.serverLoadData[item.appName].lifeCycle = scriptResult.lifeCycle;
          this.serverLoadData[item.appName].sandbox = scriptResult.sandBox;
        }
      }
    }
  }
}
