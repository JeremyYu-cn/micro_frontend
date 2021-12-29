<template>
  <img alt="Vue logo" src="../assets/logo.png" />
  <HelloWorld msg="Vue.js Demo" @close="close"></HelloWorld>
  <h1>{{ test }}</h1>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  created() {

  },
  mounted() {
    console.log(this.$route);
  },
  methods: {
    close() {
      console.log('close');
    },
  },
  computed: {
    ...mapGetters({
      test: "GET_VALUE"
    })
  }
};
</script>

<style>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
</style>
