const MAX_RUN_TASK_NUM = 5;
const MOCK_TASK_NUM = 100;
const waitTask = [];
let currentRunNum = 0;

/** 模拟请求 */
async function mockFun() {
  for (let x = 0; x < MOCK_TASK_NUM; x++) {
    runFun().then((msg) => {
      console.log(msg);
    });
  }
}

/** 执行函数 */
function runFun() {
  return new Promise(async (resolve) => {
    const f = {
      enter: Date.now(),
      method: async () => resolve(await businessFun()),
    };
    if (currentRunNum >= MAX_RUN_TASK_NUM) {
      waitTask.push(f);
    } else {
      await run(f);
    }
  });
}

async function run(func) {
  currentRunNum++;
  func().then((msg) => {
    currentRunNum--;
    if (waitTask.length > 0) {
      const task = waitTask.shift();
      console.log(waitTask.length);
      run(task);
    }
    return msg;
  });
}

/** 业务函数 */
function businessFun() {
  return new Promise((resolve) => {
    const duration = Math.random() * 1000 + 1000;
    setTimeout(() => {
      resolve(`wuhu ${duration}`);
    }, duration);
  });
}

mockFun();
