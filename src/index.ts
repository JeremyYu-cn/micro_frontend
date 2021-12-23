import { PRODUCT_BY_MICRO_FRONTEND } from './config/index';
import { RegisterData } from './globalType';
import MicroFrontend from './load/index';

(async () => {
  const appList: RegisterData[] = [
    {
      appName: 'middleReact',
      entry: 'http://localhost:3001',
      containerId: '#middle_background',
      activeRoute: '/react',
    },
    // {
    //   appName: 'middleBackground',
    //   entry: 'http://localhost:3000',
    //   containerId: '#middle_background',
    //   activeRoute: '/vue',
    // },
  ];
  const microService = new MicroFrontend(appList);
  await microService.init();
  await microService.start();
  // window.history.pushState({ [PRODUCT_BY_MICRO_FRONTEND]: true }, '', '/vue');
})();
