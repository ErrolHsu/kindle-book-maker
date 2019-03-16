<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <div>
      <input v-model='targetUrl'></input>
    </div>
    <div v-on:click='fetchBook' class='btn mt-1'>
      Fetch Book
    </div>

    <hr>

    <div>
      書名: {{bookInfo.bookName}}
    </div>

    <div>
      作者: {{bookInfo.author}}
    </div>

    <div @click='generateBook' class='btn mt-1'>
      Build Book
    </div>


    <!-- <div v-on:click='test' style='cursor: pointer'>
      翻譯
    </div> -->

    <!-- <div v-on:click='screenshot'>
      截圖
    </div> -->

    <!-- <div href="#" id="drag"></div> -->
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
  data () {
    return {
      targetUrl: '',
      bookInfo: {
        targetPageUrl: '',
        bookName: '',
        author: '',
        lastPageUrl: '',
      }
    }
  },
  mounted() {
    // const self = this;
    // const holder = document.getElementById('drag')

    // holder.ondragover = (event) => {
    //   event.preventDefault();
    //   event.dataTransfer.dropEffect = 'copy';
    //   return false;
    // };

    // holder.ondragleave = (e) => {
    //     e.preventDefault();
    //     return false;
    // };

    // holder.ondragend = (e) => {
    //     e.preventDefault();
    //     return false;
    // };

    // holder.ondrop = (e) => {
    //   e.preventDefault();

    //   for (let f of e.dataTransfer.files) {
    //     console.log('File(s) you dragged here: ', f.path)
    //     ipcRenderer.send('test-build', f.path)
    //   }

    //   return false;
    // };

    ipcRenderer.on('fetch-book-reply', (event, bookInfo) => {
      console.log(event)
      console.log(bookInfo)
      // this.bookName = bookInfo.bookName
      // this.author = bookInfo.author
      this.bookInfo = Object.assign({}, bookInfo)
    })

  },

  methods: {
    fetchBook: function() {
      ipcRenderer.send('fetch-book', {targetUrl: this.targetUrl})
    },

    generateBook: function() {
      ipcRenderer.send('generate-book', this.bookInfo)
    },

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
  margin-top: 60px;
}

#drag {
  height: 300px;
  width: 300px;
  border: 1px solid #444;
}

</style>
