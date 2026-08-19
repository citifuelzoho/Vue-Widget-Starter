<template>
  <main class="widget-shell">
    <div v-auto-animate>
      <HomeForm v-if="appState.page === 'home'" key="home" />
      <IntroForm v-if="appState.page === 'intro'" key="intro" />
      <PostServiceFeedbackForm
        v-if="appState.page === 'post-service-feedback'"
        key="post-service-feedback"
      />
      <ActiveClientFeedbackForm
        v-if="appState.page === 'active-client-feedback'"
        key="active-client-feedback"
      />
    </div>
  </main>
</template>

<script setup>
  import HomeForm from './components/forms/HomeForm.vue'
  import IntroForm from './components/forms/IntroForm.vue'
  import PostServiceFeedbackForm from './components/forms/PostServiceFeedbackForm.vue'
  import ActiveClientFeedbackForm from './components/forms/ActiveClientFeedbackForm.vue'
  import { appState } from './store'
</script>
