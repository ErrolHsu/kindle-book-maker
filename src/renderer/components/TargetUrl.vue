<template>
  <div class="container">
    <div>
      <form class="form">
        <input v-model='targetUrl' class="form-field" placeholder="Your Target URL" />
        <button v-on:click='fetchBook' type="button" class="btn inside uppercase">Fetch</button>
      </form>
    </div>

    <transition name="opacity">
      <div id='book-info' class='mt-2' v-show='bookInfoShow'>

        <div id='get-book-box' v-show='getBookBoxShow'>
          <div class='info'>
            <div>
              書名： 
              <input type="text" v-model="bookInfo.bookName">
            </div>

            <div>
              作者： 
              <input type="text" v-model="bookInfo.author">
            </div>
          </div>
          <div @click='generateBook' class='btn mt-1'>
            BUILD BOOK
          </div>
        </div>

        <div id='result-box' class='green' v-show='resultBoxShow'>
          <span>Your ebook is now at: </span>
          <span style='font-weight: bolder;'> {{output}}</span>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
  import { ipcRenderer } from  'electron'
  import eventBus from '../eventBus'

  export default {

    data() {
      return {
        targetUrl: '',
        bookInfoShow: false,
        getBookBoxShow: false,
        resultBoxShow: false,
        bookInfo: {
          targetPageUrl: '',
          bookName: '',
          author: '',
        },
        output: ''
      }
    },

    mounted() {
      ipcRenderer.on('fetch-book-reply', (event, bookInfo) => {
        eventBus.$emit('end-loadding')
        this.bookInfo = Object.assign({}, bookInfo)
        this.bookInfoShow = true
        this.getBookBoxShow = true
        this.resultBoxShow = false
      })

      ipcRenderer.on('job-done', (event, output) => {
        eventBus.$emit('end-loadding')
        this.output = output
        this.getBookBoxShow = false
        this.resultBoxShow = true
      })
    },

    methods: {
      fetchBook: function() {
        eventBus.$emit('loadding')
        this.bookInfoShow = false;
        ipcRenderer.send('fetch-book', {targetUrl: this.targetUrl})
      },

      generateBook: function() {
        eventBus.$emit('loadding')
        ipcRenderer.send('generate-book', this.bookInfo)
      },
    }
  }
</script>

<style scoped>
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 60px;
  }

  a {
    color: inherit;
  }

  a:hover {
    color: #7f8ff4;
  }

  .uppercase {
    text-transform: uppercase;
  }

  .inside {
    margin-left: -46px;
    position: relative;
  }

  .form-field {
    width: 560px;
    background: #fff;
    color: #a3a3a3;
    font: inherit;
    box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.1);
    border: 0;
    outline: 0;
    padding: 22px 18px;
  }

  #book-info {
    width: 645px;
    background: #fff;
    color: #555;
    box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.1);
    padding: 22px 18px;
  }

  .info {
    font-weight: bold;
    font-size: 1.15rem;
  }

  .info input {
    outline: 0;
    border: 0;
    border-bottom: 1px dashed #444;
    padding: 10px;
    font-size: 1rem;
  }

</style>
