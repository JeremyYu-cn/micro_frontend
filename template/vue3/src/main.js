import './public-path';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import routes from './router';
import store from './store';

let router = null;
let instance = null;
let history = null;

function render(props = {}) {
  const { container } = props;
  history = createWebHistory(window.PRODUCT_BY_MICRO_FRONTEND ? '/vue' : '/');
  router = createRouter({
    history,
    routes,
  });

  // props.store.listen({
  //   key: 'aa',
  //   callback: ({ key, value, oldValue }) => {
  //     console.log('trigger', key, value, oldValue);
  //   },
  // });

  // props.store.set('aa', '123');
  // props.store.get('aa');
  instance = createApp(App);
  instance.use(router);
  instance.use(store);
  instance.mount(container ? container.querySelector('#app') : '#app');
}
console.log(window.PRODUCT_BY_MICRO_FRONTEND);
if (!window.PRODUCT_BY_MICRO_FRONTEND) {
  console.log(window.PRODUCT_BY_MICRO_FRONTEND);
  render();
}

export async function bootstrap() {
  console.log('%c ', 'color: green;', 'vue3.0 app bootstraped');
}

export async function mount(props) {
  console.log(props);
  render(props);
  instance.config.globalProperties.$onGlobalStateChange =
    props.onGlobalStateChange;
  instance.config.globalProperties.$setGlobalState = props.setGlobalState;
}

export async function unmount() {
  instance.unmount();
  instance._container.innerHTML = '';
  instance = null;
  router = null;
  history.destroy();
}
