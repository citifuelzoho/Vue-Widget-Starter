import { ref } from 'vue'

export function useUserStore() {
  const user = ref(null)

  async function fetchUser() {
    const responseData = await ZOHO.CRM.CONFIG.getCurrentUser()
    user.value = responseData.users[0]
  }

  return {
    user,
    fetchUser
  }
}
