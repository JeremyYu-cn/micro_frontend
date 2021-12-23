import type { triggerEventParam } from '../globalType';

/** 创建全局store */
export function createStore() {
  const globalStore = new Proxy(<Record<string, any>>{}, {
    get(target, key: string) {
      return target[key];
    },
    set(target, key: string, value) {
      const oldVal = target[key];
      target[key] = value;

      // 触发监听事件
      triggerEvent({ key, value, oldValue: oldVal });
      return true;
    },
  });
  return globalStore;
}

/** 监听对象 */
const listener: Map<
  string,
  Record<string, (data: triggerEventParam<any>) => void>
> = new Map();
/** 新增store监听器 */
export function addNewListener(appName: string) {
  if (listener.has(appName)) return;
  listener.set(appName, {});
}

/** 改变字段值触发事件 */
export function triggerEvent<T extends any>(data: triggerEventParam<T>) {
  listener.forEach((val) => {
    if (val[data.key] && typeof val[data.key] === 'function') {
      val[data.key](data);
    }
  });
}

/** 设置监听事件 */
export function setEventTrigger<T extends any>(
  appName: string,
  key: string,
  callback: (data: triggerEventParam<T>) => void
) {
  if (listener.has(appName)) {
    const obj = listener.get(appName);
    if (obj) {
      obj[key] = callback;
    }
  }
}

/** 设置全局变量 */
export function setStoreValue<T extends any>(
  target: Record<string, any>,
  key: string,
  value: T
) {
  target[key] = value;
  return true;
}

/** 清除全局变量监听 */
export function clearEventTrigger(appName: string) {
  listener.set(appName, {});
}
