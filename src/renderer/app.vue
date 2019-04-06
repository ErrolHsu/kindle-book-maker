<template>
  <div id="app">
    <Loader></Loader>
    <Message></Message>
    <MainContent></MainContent>
  </div>
</template>

<script>
import { ipcRenderer } from  'electron'
import eventBus from './eventBus'
// components
import MainContent from './components/mainContent.vue'
import Message from './components/message.vue'
import Loader from './components/loader.vue'

export default {
  name: 'app',
  components: {
    MainContent,
    Message,
    Loader,
  },
  data() {
    return {
    }
  },
  mounted() {
    ipcRenderer.on('msg', (event, data) => {
      eventBus.$emit('msg', data)
    })
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
