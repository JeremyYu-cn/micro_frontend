import { PRODUCT_BY_MICRO_FRONTEND } from './config/index';
import { RegisterData } from './globalType';
import MicroFrontend from './load/index';

(async () => {
  const appList: RegisterData[] = [
    {
      appName: 'middleReact',
      entry: 'http://localhost:3001',
      containerId: '#middle_background_react',
      activeRoute: '/',
      type: 'esbuild',
    },
    {
      appName: 'middleVue',
      entry: 'http://localhost:7105',
      containerId: '#middle_background_vue',
      activeRoute: '/vue',
      type: 'webpack',
    },
  ];
  const microService = new MicroFrontend(appList);
  await microService.init();
  await microService.start();
  // window.history.pushState({ [PRODUCT_BY_MICRO_FRONTEND]: true }, '', '/vue');
})();
