interface SandBoxImplement {
  active: () => void;
  inActive: () => void;
}

/** 沙箱操作 */
class SandBox implements SandBoxImplement {
  public proxy: Record<string, any>;
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
    const fateWindow = new Map();
    this.proxy = new Proxy(fateWindow, {
      set: (target, key, value) => {
        if (this.isSandboxActive) {
          if (Object.keys(this.name).includes(<string>key)) {
            context[<string>key] = value;
          }
          target.set(<string>key, value);
        }
        return true;
      },
      get: (target, key) => {
        if (target.has(<string>key)) {
          return target.get(<string>key);
        } else if (Object.keys(context).includes(<string>key)) {
          return context[<string>key];
        }
        return undefined;
      },
    });
  }
}

export default SandBox;
