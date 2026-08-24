<template>
  <form @submit.prevent="createActiveClientFeedbackTouchpoint">
    <BaseSelect
      id="overall-experience"
      label="Overall Experience"
      v-model="overallExperience"
      :options="OverallExperienceOptions"
      placeholder="Select overall experience"
      :required="true"
    />

    <BaseMultiSelect
      id="client-likes"
      label="What Client Likes About Truck.me"
      v-model="clientLikes"
      :options="ClientLikesOptions"
      :required="true"
    />

    <BaseSelect
      id="main-reason"
      label="Main Reason Client Continues Using Truck.me"
      v-model="mainReason"
      :options="MainReasonOptions"
      placeholder="Select main reason"
      :required="true"
    />

    <BaseMultiSelect
      id="what-can-improve"
      label="What Can We Improve?"
      v-model="whatCanImprove"
      :options="WhatCanImproveOptions"
      :required="true"
    />

    <BaseSelect
      id="has-concerns"
      label="Does Client Have Any Concerns?"
      v-model="hasConcerns"
      :options="YesNoOptions"
      placeholder="Select an option"
      :required="true"
    />

    <BaseSelect
      v-if="hasConcerns === 'Yes'"
      id="primary-concern"
      label="Primary Concern"
      v-model="primaryConcern"
      :options="PrimaryConcernOptions"
      placeholder="Select primary concern"
      :required="true"
    />

    <ReasonBranchFields
      :branch="concernBranch"
      v-model:competitor-name="competitorName"
      :communication-options="CommunicationIssueOptions"
      communication-field-key="Communication_Issue"
      ref="reasonBranchRef"
    />

    <BaseInput
      id="next-action-date"
      label="Next Action date"
      v-model="nextActionDate"
      type="date"
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
  import { computed, ref } from 'vue'
  import BaseSelect from '../BaseSelect.vue'
  import BaseMultiSelect from '../BaseMultiSelect.vue'
  import BaseInput from '../BaseInput.vue'
  import BaseButton from '../BaseButton.vue'
  import ReasonBranchFields from './ReasonBranchFields.vue'
  import { appState } from '../../store'
  import {
    OverallExperienceOptions,
    ClientLikesOptions,
    MainReasonOptions,
    WhatCanImproveOptions,
    YesNoOptions,
    PrimaryConcernOptions,
    CommunicationIssueOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { useUserStore } from '../../store/user'

  // Maps this form's own "Primary Concern" dropdown onto the shared
  // branch-field keys — see ReasonBranchFields.vue. Every value here matches
  // exactly one branch except "Other", which has no extra fields.
  const PRIMARY_CONCERN_TO_BRANCH = {
    Price: 'price',
    Competitor: 'competitorChoice',
    'Location / Coverage': 'location',
    'Service Availability': 'serviceAvailability',
    'Bad Service Experience': 'badService',
    'Billing / Payment': 'billing',
    Communication: 'communication',
    'Driver Related': 'driver'
  }

  const { user, fetchUser } = useUserStore()
  fetchUser()

  const isLoading = ref(false)
  const nextActionDate = ref('')
  const overallExperience = ref('')
  const clientLikes = ref([])
  const mainReason = ref('')
  const whatCanImprove = ref([])
  const hasConcerns = ref('')
  const primaryConcern = ref('')

  const reasonBranchRef = ref(null)
  // Collapses to '' whenever "Does Client Have Any Concerns?" isn't Yes, not
  // just when no concern is picked yet — otherwise switching Yes -> pick a
  // concern -> back to No leaves the concern's sub-fields rendered (and their
  // stale answers still flowing into the payload) even though Primary_Concern
  // itself correctly resets to '' below.
  const concernBranch = computed(() =>
    hasConcerns.value === 'Yes'
      ? PRIMARY_CONCERN_TO_BRANCH[primaryConcern.value] || ''
      : ''
  )

  const competitorName = ref('')

  async function createActiveClientFeedbackTouchpoint() {
    isLoading.value = true

    const resolvedPrimaryConcern =
      hasConcerns.value === 'Yes' ? primaryConcern.value : ''
    const branchFields = reasonBranchRef.value?.getApiFields() || {}

    const apiData = {
      Maintenance_Offers: appState.value.entityId,
      Conversation_Type: appState.value.conversationType,
      Call_Outcome: appState.value.callOutcome,
      Next_Action_Date: nextActionDate.value,
      Overall_Experience: overallExperience.value,
      Client_Likes: clientLikes.value,
      Main_Reason: mainReason.value,
      What_Can_We_Improve: whatCanImprove.value,
      Has_Concerns: hasConcerns.value,
      Primary_Concern: resolvedPrimaryConcern,
      Owner: user.value?.id || '',
      ...branchFields
    }

    await createTouchpoint(apiData).finally(() => {
      isLoading.value = false
    })

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>
