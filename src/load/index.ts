import { RegisterData } from '../globalType';
import { addNewListener, createStore } from '../storage/index';
import { loadHtml, LoadHtmlResult } from './load';
import { runScript } from './run';

interface MicroFrountendMethod {}

export default class MicroFrountend implements MicroFrountendMethod {
  /** 微应用列表 */
  private servers: RegisterData[];
  /** 请求后的应用列表 */
  private serverLoadData: Record<string, LoadHtmlResult>;
  /** 默认路由 */
  public defaultRoute: string;

  constructor(servers: RegisterData[]) {
    this.servers = servers;
    this.serverLoadData = {};
    this.defaultRoute = '';
  }

  /** 初始化 */
  public async init() {
    for (let item of this.servers) {
      const serverData = await loadHtml(item.entry);
      addNewListener(item.appName);
      this.serverLoadData[item.appName] = serverData;
    }
    if (this.servers.length) {
      this.defaultRoute = this.servers[0].activeRoute;
    }
    return true;
  }

  /** 设置默认路由 */
  public async setDefaultRoute(routeName: string) {
    const isInclude = Object.keys(this.serverLoadData).includes(routeName);
    if (!isInclude) {
      return false;
    }
    this.defaultRoute = routeName;
    return true;
  }

  /** 开启加载微前端应用 */
  public async start() {
    const appIndex = this.servers.findIndex(
      (val) => val.activeRoute === this.defaultRoute
    );
    if (appIndex == -1) {
      console.warn('route is not found');
      return false;
    }
    const appName = this.servers[appIndex].appName;
    const htmlData = this.serverLoadData[appName];
    const store = createStore();
    await runScript(this.servers[appIndex], htmlData, store);
  }
}
