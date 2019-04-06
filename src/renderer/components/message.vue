<template>
  <div>
    <div class="mask" v-show='show'>
      <div id='message-content'>
        <div v-for='message in messages'>
          {{message}}
        </div>
      </div>
      <div @click='close' class='pointer close'>
        <font-awesome-icon icon="times"></font-awesome-icon>
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

      eventBus.$on('msg-close', (data) => {
        this.show = false;
      })

    },

    methods: {
      addMessage(data) {
        this.messages.push(data)
        if (this.messages.length > 15) {
          this.messages.shift()
        }
      },

      close() {
        this.show = false;
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
    padding-top: 15px;
  }

  #message-content {
    text-align: left;
    padding-left: 15px;
    color: #fff;
    font-size: 14px;
  }

  .close {
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 8px 0;
    background: rgb(75, 21, 21, 0.5);
    color: #fff;
  }

  .close:hover {
    background: rgb(75, 21, 21, 0.6);
  }

</style>
