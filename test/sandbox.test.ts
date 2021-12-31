import SandBox from '../src/sandbox/index';

describe('Test SandBox', () => {
  it('Test SandBox Active', () => {
    // @ts-ignore
    const sandBox = new SandBox('Test', global);
    sandBox.active();
    sandBox.proxy.a = 1;
    sandBox.proxy.b = 2;
    expect(sandBox.proxy.a).toBe(1);
    expect(sandBox.proxy.b).toBe(2);
    // @ts-ignore
    expect(global.a).toBeUndefined();
  });

  it('Test SandBox InActive', () => {
    // @ts-ignore
    const sandBox = new SandBox('Test', global);
    sandBox.active();
    sandBox.proxy.a = 1;
    sandBox.proxy.b = 2;
    sandBox.inActive();
    sandBox.proxy.a = 3;
    sandBox.proxy.b = 4;
    expect(sandBox.proxy.a).toBe(1);
    expect(sandBox.proxy.b).toBe(2);
  });

  it('Test SandBox Not Active', () => {
    // @ts-ignore
    const sandBox = new SandBox('Test', global);
    sandBox.proxy.a = 1;
    sandBox.proxy.b = 2;
    expect(sandBox.proxy.a).toBeUndefined();
    expect(sandBox.proxy.b).toBeUndefined();
  });
});
