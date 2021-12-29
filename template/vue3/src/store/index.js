import { createStore } from "vuex";
import count from "./count";

export default createStore({
  state: {
    test: "",
  },
  mutations: {
    SET_VALUE(state, value) {
      state.test = value;
    },
  },
  actions: {},
  getters: {
    GET_VALUE(state) {
      return state.test;
    },
  },
  modules: {
    count,
  },
});
