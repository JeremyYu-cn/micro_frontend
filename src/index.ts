import { RegisterData } from './globalType';
import { loadHtml } from './load/index';
import { runScript } from './load/run';

(async () => {
  const htmlData = await loadHtml('http://localhost:3000');
  const appData: RegisterData = {
    appName: 'middleBackground',
    entry: 'http://localhost:3000',
    containerId: '#middle_background',
    activeRoute: '/vue',
  };
  runScript(appData, htmlData);
})();
