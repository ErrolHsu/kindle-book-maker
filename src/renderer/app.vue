<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <div v-on:click='hi'>
      xxxxxxxx
    </div>

    <div v-on:click='screenshot'>
      截圖
    </div>

    <div href="#" id="drag"></div>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import { ipcRenderer } from  'electron'

export default {
  name: 'app',
  components: {
    // HelloWorld
  },
  mounted() {
    console.log('oooo')
    const holder = document.getElementById('drag')

    holder.ondragover = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      return false;
    };

    holder.ondragleave = (e) => {
        e.preventDefault();
        return false;
    };

    holder.ondragend = (e) => {
        e.preventDefault();
        return false;
    };

    holder.ondrop = (e) => {
      e.preventDefault();

      for (let f of e.dataTransfer.files) {
        console.log('File(s) you dragged here: ', f.path)
        ipcRenderer.send('test-build', f.path)
      }

      return false;
    };
  },
  data () {
    return {
    }
  },
  methods: {
    hi: function() {
      ipcRenderer.send('test-build')
    },

    screenshot: function() {
      ipcRenderer.send('test-screenshot')
    }
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
  margin-top: 60px;
}

#drag {
  height: 300px;
  width: 300px;
  border: 1px solid #444;
}

</style>
