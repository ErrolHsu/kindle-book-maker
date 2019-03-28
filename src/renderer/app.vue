<template>
  <div id="app">
    <Loader></Loader>
    <TargetUrl></TargetUrl>
  </div>
</template>

<script>
import TargetUrl from './components/targetUrl.vue'
import Loader from './components/loader.vue'
import { ipcRenderer } from  'electron'

export default {
  name: 'app',
  components: {
    TargetUrl,
    Loader,
  },
  data() {
    return {
    }
  },
  mounted() {
  },

  methods: {
    test: function() {
      ipcRenderer.send('test')
    },
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

:root {
  background: #f5f6fa;
  color: #9c9c9c;
  font: 1rem "PT Sans", sans-serif;
}

</style>
