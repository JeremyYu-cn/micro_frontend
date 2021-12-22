import { RegisterData } from './globalType';
import MicroFrontend from './load/index';

(async () => {
  const appList: RegisterData[] = [
    {
      appName: 'middleBackground',
      entry: 'http://localhost:3000',
      containerId: '#middle_background',
      activeRoute: '/vue',
    },
  ];
  const microService = new MicroFrontend(appList);
  await microService.init();
  await microService.start();
})();
