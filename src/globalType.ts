import { LoadScriptType } from './load/load';

export type RegisterData = {
  appName: string;
  entry: string;
  containerId: string;
  activeRoute: string;
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
