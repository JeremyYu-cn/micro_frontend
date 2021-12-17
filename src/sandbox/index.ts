interface SandBoxImplement {
  active: () => void;
  inActive: () => void;
}

class SandBox implements SandBoxImplement {
  public proxy: Record<string, any> | null;
  private isSandboxActive: boolean;
  private fateWindow: Map<string, any>;
  public name: string;

  active() {
    this.isSandboxActive = true;
  }

  inActive() {
    this.isSandboxActive = false;
  }

  constructor(appName: string, context: Window & Record<string, any>) {
    this.name = appName;
    this.isSandboxActive = false;
    this.fateWindow = new Map();
    this.proxy = new Proxy(this.fateWindow, {
      set: (target, key, value) => {
        if (
          this.isSandboxActive &&
          Object.keys(context).includes(<string>key)
        ) {
          context[<string>key] = value;
        }
        target.set(<string>key, value);
        return true;
      },
      get: (target, key) => {},
    });
  }
}
