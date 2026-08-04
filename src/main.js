import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

ZOHO.embeddedApp.on('PageLoad', async function (data) {
  console.log(data)
  const currentUser = await ZOHO.CRM.CONFIG.getCurrentUser()
  console.log('Current user:', currentUser)
})

window.ZOHO.embeddedApp.init()
createApp(App).mount('#app')
