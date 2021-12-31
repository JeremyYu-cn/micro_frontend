import { LoadScriptType } from './load/load';

export type RegisterData = {
  /** 应用名 */
  appName: string;
  /** 应用入口 */
  entry: string;
  /** 容器ID */
  containerId: string;
  /** 触发应用的路由 */
  activeRoute: string;
  /** 打包类型 esbuild | webpack */
  type: LoadScriptType;
};

export type triggerEventParam<T> = {
  key: string;
  value: T;
  oldValue: T;
};

export type UnloadFunctionParam = {
  container: Element;
};

export type LoadFunctionMountParam = {
  container: Element;
  store: {
    get: <T>(key: string) => T;
    set: <T>(key: string, value: T) => boolean;
    listen: <T>(data: {
      key: string;
      callback: (data: triggerEventParam<T>) => void;
    }) => void;
  };
};
