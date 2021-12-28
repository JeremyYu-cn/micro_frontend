interface SandBoxImplement {
  active: () => void;
  inActive: () => void;
}

export type ProxyParam = Record<string, any> & Window;

/** 沙箱操作 */
class SandBox implements SandBoxImplement {
  public proxy: ProxyParam;
  private isSandboxActive: boolean;
  public name: string;

  /** 激活沙箱 */
  active() {
    this.isSandboxActive = true;
  }

  /** 关闭沙箱 */
  inActive() {
    this.isSandboxActive = false;
  }

  constructor(appName: string, context: Window & Record<string, any>) {
    this.name = appName;
    this.isSandboxActive = false;
    const fateWindow = {};
    this.proxy = new Proxy(<ProxyParam>fateWindow, {
      set: (target, key, value) => {
        if (this.isSandboxActive) {
          target[<string>key] = value;
        }
        return true;
      },
      get: (target, key) => {
        if (target[<string>key]) {
          return target[<string>key];
        } else {
          return context[<string>key];
        }
      },
    });
  }
}

export default SandBox;
