import "./public-path";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import routes from "./router";
import store from "./store";

let router = null;
let instance = null;
let history = null;
function render(props = {}) {
  const { container } = props;
  history = createWebHistory(window.PRODUCT_BY_MICRO_FRONTEND ? "/" : "/");
  router = createRouter({
    history,
    routes,
  });
  props.store.listen({
    key: "aa",
    callback: ({ value }) => {
      store.commit("SET_VALUE", value);
    },
  });
  instance = createApp(App);
  instance.use(router);
  instance.use(store);
  instance.mount(container ? container.querySelector("#app") : "#app");
}
if (!window.PRODUCT_BY_MICRO_FRONTEND) {
  render();
}
export async function beforeMount() {
  console.log("%c ", "color: green;", "vue3.0 app bootstraped");
}
export async function mount(props) {
  render(props);
}
export async function unmount() {
  instance.unmount();
  instance._container.innerHTML = "";
  instance = null;
  router = null;
  history.destroy();
}
