<template>
  <form @submit.prevent="submitHomeForm">
    <BaseSelect
      id="conversation-type"
      label="Conversation option"
      v-model="appState.conversationType"
      :options="ConversationTypes"
      placeholder="Select a conversation option"
      :required="true"
    />

    <BaseSelect
      id="call-outcome"
      label="Call outcome"
      v-model="appState.callOutcome"
      :options="CallOutcomeOptions"
      placeholder="Select a call outcome"
      :required="true"
    />

    <BaseInput
      v-if="isNotConnected"
      id="next-action-date"
      label="Next Action date"
      v-model="appState.nextActionDate"
      type="date"
      :required="true"
    />

    <div>
      <BaseButton
        type="submit"
        variant="primary"
        :disabled="
          !appState.conversationType || !appState.callOutcome || isLoading
        "
      >
        {{ isLoading ? 'Submitting...' : isNotConnected ? 'Submit' : 'Next' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import BaseSelect from '../BaseSelect.vue'
  import BaseInput from '../BaseInput.vue'
  import BaseButton from '../BaseButton.vue'
  import { appState } from '../../store'
  import { useUserStore } from '../../store/user'
  import {
    ConversationTypes,
    CallOutcomeOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'

  const isLoading = ref(false)
  const { user, fetchUser } = useUserStore()
  fetchUser()
  const isNotConnected = computed(
    () =>
      !!appState.value.callOutcome && appState.value.callOutcome !== 'Connected'
  )

  async function submitHomeForm() {
    if (isNotConnected.value) {
      isLoading.value = true

      const apiData = {
        Maintenance_Offers: appState.value.entityId,
        Conversation_Type: appState.value.conversationType,
        Call_Outcome: appState.value.callOutcome,
        Next_Action_Date: appState.value.nextActionDate,
        Owner: user.value?.id || ''
      }

      await createTouchpoint(apiData).finally(() => {
        isLoading.value = false
      })

      alert('Touchpoint created successfully.')
      setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
      return
    }

    if (appState.value.conversationType == 'Intro')
      appState.value.page = 'intro'
    else if (appState.value.conversationType == 'Post-service feedback')
      appState.value.page = 'post-service-feedback'
    else if (appState.value.conversationType == 'Active Client Feedback')
      appState.value.page = 'active-client-feedback'
  }
</script>
