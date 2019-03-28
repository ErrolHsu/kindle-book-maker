<template>
  <div>
    <div class="mask" v-show='show'>
      <div class="lds-circle">
        <div></div>
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
      }
    },

    mounted() {
      eventBus.$on('loadding', () => {
        this.show = true;
      })

      eventBus.$on('end-loadding', () => {
        this.show = false;
      })
    },
  }
</script>

<style scoped>
  .mask {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,.5);;
    opacity: 0.8;
    width: 100%;
    height: 100%;
    z-index: 50;
  }

  .lds-circle {
    display: inline-block;
    transform: translateZ(1px);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .lds-circle > div {
    display: inline-block;
    width: 51px;
    height: 51px;
    margin: 6px;
    border-radius: 50%;
    background: #fff;
    animation: lds-circle 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }

  @keyframes lds-circle {
    0%, 100% {
      animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
    }
    0% {
      transform: rotateY(0deg);
    }
    50% {
      transform: rotateY(1800deg);
      animation-timing-function: cubic-bezier(0, 0.5, 0.5, 1);
    }
    100% {
      transform: rotateY(3600deg);
    }
  }

</style>
