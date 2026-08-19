<template>
  <form @submit.prevent="createIntroTouchpoint">
    <BaseSelect
      id="client-reaction"
      label="Client reaction"
      v-model="appState.clientReaction"
      :options="ClientReactionOptions"
      placeholder="Select a client reaction"
      :required="true"
    />

    <BaseSelect
      v-if="appState.clientReaction === 'Refused'"
      id="refusal-reason"
      label="Refusal reason"
      v-model="appState.refusalReason"
      :options="RefusalReasonOptions"
      placeholder="Select a refusal reason"
      :required="true"
    />

    <BaseSelect
      v-if="appState.clientReaction === 'Refused'"
      id="refusal-confidence"
      label="Refusal confidence"
      v-model="appState.refusalConfidence"
      :options="RefusalConfidenceOptions"
      placeholder="Select a refusal confidence"
      :required="true"
    />

    <BaseInput
      id="next-action-date"
      label="Next Action date"
      v-model="appState.nextActionDate"
      type="date"
      :required="true"
    />

    <BaseMultiSelect
      id="services-discussed"
      label="Services Discussed"
      v-model="appState.servicesDiscussed"
      :options="ServicesDiscussedOptions"
      :required="true"
    />

    <BaseTextarea
      id="summary-notes"
      label="Summary Notes"
      v-model="appState.summaryNotes"
      placeholder="Enter summary notes"
      :rows="5"
      :required="true"
    />

    <div>
      <BaseButton type="submit" variant="primary" :disabled="isLoading">
        {{ isLoading ? 'Submitting...' : 'Submit' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
  import { ref } from 'vue'
  import BaseSelect from '../BaseSelect.vue'
  import BaseInput from '../BaseInput.vue'
  import BaseMultiSelect from '../BaseMultiSelect.vue'
  import BaseTextarea from '../BaseTextarea.vue'
  import BaseButton from '../BaseButton.vue'
  import { appState } from '../../store'
  import {
    ClientReactionOptions,
    RefusalReasonOptions,
    RefusalConfidenceOptions,
    ServicesDiscussedOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { andSymbolEncode } from '../../utils/andSymbolEncode'
  import { useUserStore } from '../../store/user'

  const isLoading = ref(false)
  const { user, fetchUser } = useUserStore()
  fetchUser()
  async function createIntroTouchpoint() {
    isLoading.value = true

    const apiData = {
      Maintenance_Offers: appState.value.entityId,
      Conversation_Type: appState.value.conversationType,
      Call_Outcome: appState.value.callOutcome,
      Client_Reaction: appState.value.clientReaction,
      Refusal_Reason:
        appState.value.clientReaction === 'Refused'
          ? appState.value.refusalReason
          : '',
      Refusal_Confidence:
        appState.value.clientReaction === 'Refused'
          ? appState.value.refusalConfidence
          : '',
      Next_Action_Date: appState.value.nextActionDate,
      Services_Discussed: appState.value.servicesDiscussed.map(e =>
        andSymbolEncode(e)
      ),
      Summary_Notes: andSymbolEncode(appState.value.summaryNotes),
      Owner: user.value?.id || ''
    }

    await createTouchpoint(apiData).finally(() => {
      isLoading.value = false
    })

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>
