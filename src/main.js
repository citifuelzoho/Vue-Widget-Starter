import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { appState } from './store'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

ZOHO.embeddedApp.on('PageLoad', async function (data) {
  const entityId = data?.EntityId?.[0] || ''
  appState.value.entityId = entityId
  ZOHO.CRM.UI.Resize({ width: '1000', height: '750' })
  ZOHO.CRM.CONFIG.getCurrentUser().then(function (data) {
    console.log(data)
  })
  createApp(App).use(autoAnimatePlugin).mount('#app')
})

window.ZOHO.embeddedApp.init()
