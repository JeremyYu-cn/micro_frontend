import {
  createStore,
  getStoreValue,
  setStoreValue,
  addNewListener,
  setEventTrigger,
} from '../src/storage/index';

describe('Test Store', () => {
  it('Test Set Param', async () => {
    const store = createStore();
    setStoreValue(store, 'aa', '123');
    const val = getStoreValue(store, 'aa');
    expect(val).toBe('123');
  });

  it('Test trigger event', () => {
    const store = createStore();
    const appName = 'test';
    addNewListener(appName);
    setEventTrigger(appName, 'test', (data) => {
      expect(data.value).toBe(123);
    });
    setStoreValue(store, 'test', 123);
  });
});
