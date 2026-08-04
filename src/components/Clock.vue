<template>
  <div class="clock">
    {{ time }}
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'

  const time = ref('00:00:00')
  let timer = null

  const updateTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    time.value = `${hours}:${minutes}:${seconds}`
  }

  onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
    }
  })
</script>

<style scoped>
  .clock {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 1rem;
    letter-spacing: 0.08em;
  }
</style>
