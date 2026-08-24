<template>
  <form @submit.prevent="submitHomeForm">
    <BaseSelect
      id="conversation-type"
      label="Conversation option"
      v-model="appState.conversationType"
      :options="availableConversationTypes"
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
      v-model="nextActionDate"
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
  import { useMaintenanceOfferStore } from '../../store/maintenanceOffer'
  import {
    ConversationTypes,
    CallOutcomeOptions,
    AllowedConversationTypesByLifecycleStatus
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'

  const isLoading = ref(false)
  const nextActionDate = ref('')
  const { user, fetchUser } = useUserStore()
  fetchUser()
  const { maintenanceOffer, fetchMaintenanceOffer } = useMaintenanceOfferStore()
  fetchMaintenanceOffer()
  const isNotConnected = computed(
    () =>
      !!appState.value.callOutcome && appState.value.callOutcome !== 'Connected'
  )
  // Filtered by Lifecycle_Status once the record loads; shows every option
  // beforehand (or if the current stage isn't in the map) rather than
  // blocking the form on the fetch.
  const availableConversationTypes = computed(() => {
    const stage = maintenanceOffer.value?.Lifecycle_Status
    const allowedValues = AllowedConversationTypesByLifecycleStatus[stage]
    if (!allowedValues) return ConversationTypes
    return ConversationTypes.filter(option =>
      allowedValues.includes(option.value)
    )
  })

  async function submitHomeForm() {
    if (isNotConnected.value) {
      isLoading.value = true

      const apiData = {
        Maintenance_Offers: appState.value.entityId,
        Conversation_Type: appState.value.conversationType,
        Call_Outcome: appState.value.callOutcome,
        Next_Action_Date: nextActionDate.value,
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
    else if (appState.value.conversationType == 'Re-engagement')
      appState.value.page = 're-engagement'
    else if (appState.value.conversationType == 'Churned Feedback')
      appState.value.page = 'churned-feedback'
  }
</script>
