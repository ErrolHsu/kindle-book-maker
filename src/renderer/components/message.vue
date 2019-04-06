<template>
  <div>
    <div class="mask" v-show='show'>
      <div id='message-content'>
        <div v-for='message in messages'>
          {{message}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from  'electron'
  import eventBus from '../eventBus'

  export default {
    data() {
      return {
        show: false,
        messages: [],
      }
    },

    mounted() {
      eventBus.$on('msg', (data) => {
        this.show = true;
        this.addMessage(data)
      })

    },

    methods: {
      addMessage(data) {
        this.messages.push(data)
        if (this.messages.length > 16) {
          this.messages.shift()
        }
      },

    }
  }
</script>

<style scoped>
  .mask {
    overflow: hidden;
    position: absolute;
    background: rgba(156, 79, 79, 0.5);
    opacity: 0.8;
    width: 50%;
    height: 100%;
    z-index: 60;
    padding-top: 20px;
    padding-left: 20px;
  }

  #message-content {
    text-align: left;
    color: #fff;
    font-size: 14px;
  }

</style>
