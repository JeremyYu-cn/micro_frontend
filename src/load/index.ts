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
  /** 全局store */
  public store: Record<string, any>;

  constructor(servers: RegisterData[]) {
    this.servers = servers;
    this.serverLoadData = {};
    this.currentRoute = '';
    this.store = createStore();
  }

  /** 初始化 */
  public async init() {
    for (let item of this.servers) {
      const serverData = await loadHtml(item.entry);
      addNewListener(item.appName);
      this.serverLoadData[item.appName] = serverData;
    }
    if (this.servers.length) {
      this.setDefaultRoute(this.servers[0].activeRoute);
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

  /** 开启加载微前端应用 */
  public async start() {
    const appIndex = this.servers.findIndex(
      (val) => val.activeRoute === this.currentRoute
    );
    if (appIndex == -1) {
      console.warn('route is not found');
      return false;
    }
    const appName = this.servers[appIndex].appName;
    const htmlData = this.serverLoadData[appName];
    const lifeCycle = await runScript(
      this.servers[appIndex],
      htmlData,
      this.store
    );

    this.serverLoadData[appName].lifeCycle = lifeCycle;

    loadRouterListen((oldPath, pathName, param) =>
      this.handleRouterListen(oldPath, pathName, param)
    );
  }

  // 处理路由监听服务
  handleRouterListen(oldPathName: string, pathName: string, param: any) {
    if (param[PRODUCT_BY_MICRO_FRONTEND]) {
      const oldAppIndex = this.servers.findIndex(
        (val) => val.activeRoute === oldPathName
      );
      const newAppIndex = this.servers.findIndex(
        (val) => val.activeRoute === pathName
      );

      // 卸载旧服务
      if (oldAppIndex > -1 && newAppIndex > -1) {
        const oldContainerId = this.servers[oldAppIndex].containerId;
        const newContainerId = this.servers[newAppIndex].containerId;
        if (oldContainerId === newContainerId) {
          const appName = this.servers[oldAppIndex].appName;
          const container = document.querySelector(oldContainerId);
          const lifeCycle = this.serverLoadData[appName].lifeCycle;
          if (container && lifeCycle) {
            unmountScript(appName, container, lifeCycle);
          }
        }
      }

      // 挂载新服务
      if (newAppIndex > -1) {
        const newAppName = this.servers[newAppIndex].appName;
        console.log(this.servers[newAppIndex].activeRoute, this.currentRoute);

        if (this.servers[newAppIndex].activeRoute !== this.currentRoute) {
          this.setDefaultRoute(this.servers[newAppIndex].activeRoute);
          runScript(
            this.servers[newAppIndex],
            this.serverLoadData[newAppName],
            this.store
          );
        }
      }
    }
  }
}
