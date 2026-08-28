<template>
  <form @submit.prevent="createReEngagementTouchpoint">
    <BaseSelect
      id="reason-stopped"
      label="Why Did Client Stop Using Truck.me?"
      v-model="reasonStopped"
      :options="ReasonStoppedOptions"
      placeholder="Select a reason"
      :required="true"
    />

    <ReasonBranchFields
      :branch="reasonBranch"
      v-model:competitor-name="competitorName"
      v-model:why-competitor-won="whyCompetitorWon"
      ref="reasonBranchRef"
    />

    <BaseMultiSelect
      id="what-can-bring-back"
      label="What Can Bring Client Back?"
      v-model="whatCanBringBack"
      :options="WhatCanBringBackOptions"
      :required="true"
    />

    <BaseMultiSelect
      id="target-service"
      label="Target Service"
      v-model="targetService"
      :options="TargetServiceOptions"
      :required="true"
    />

    <BaseSelect
      id="return-potential"
      label="Return Potential"
      v-model="returnPotential"
      :options="ReturnPotentialOptions"
      placeholder="Select return potential"
      :required="true"
    />

    <BaseSelect
      id="re-engagement-status"
      label="Re-engagement Status"
      v-model="reEngagementStatus"
      :options="ReEngagementStatusOptions"
      placeholder="Select current status"
      :required="true"
    />

    <BaseSelect
      id="is-closing"
      label="Closing Out This Re-engagement?"
      v-model="isClosingReEngagement"
      :options="YesNoOptions"
      placeholder="Select an option"
      :required="true"
    />

    <template v-if="isClosingReEngagement === 'Yes'">
      <BaseSelect
        id="re-engagement-outcome"
        label="Re-engagement Outcome"
        v-model="reEngagementOutcome"
        :options="ReEngagementOutcomeOptions"
        placeholder="Select outcome"
        :required="true"
      />

      <BaseMultiSelect
        v-if="reEngagementOutcome === 'Reactivated'"
        id="what-brought-back"
        label="What Brought Client Back?"
        v-model="whatBroughtClientBack"
        :options="WhatBroughtClientBackOptions"
        :required="true"
      />

      <template v-if="reEngagementOutcome === 'Not Now'">
        <BaseSelect
          id="why-not-now"
          label="Why Not Now?"
          v-model="whyNotNow"
          :options="WhyNotNowOptions"
          placeholder="Select a reason"
          :required="true"
        />
      </template>

      <template v-if="reEngagementOutcome === 'Lost To Competitor'">
        <BaseInput
          id="competitor-name-lost"
          label="Competitor Name"
          v-model="competitorName"
          :required="true"
        />

        <BaseSelect
          id="why-competitor-won"
          label="Why Competitor Won?"
          v-model="whyCompetitorWon"
          :options="CompetitorReasonOptions"
          placeholder="Select a reason"
          :required="true"
        />
      </template>

      <p v-if="opensChurnedForm" class="zp-handoff-note">
        This outcome closes out Re-engagement as Churned. Nothing is saved yet —
        submitting will take you straight into the Churned form to finish and
        save the intake there; anything already known (like the competitor's
        name) carries over, and the next follow-up date is collected on that
        form instead of here.
      </p>
    </template>

    <BaseInput
      v-if="!opensChurnedForm"
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
    ReasonStoppedOptions,
    WhatCanBringBackOptions,
    TargetServiceOptions,
    ReturnPotentialOptions,
    ReEngagementStatusOptions,
    ReEngagementOutcomeOptions,
    WhatBroughtClientBackOptions,
    WhyNotNowOptions,
    CompetitorReasonOptions,
    YesNoOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { useUserStore } from '../../store/user'
  import { setHandoffData } from '../../store/handoff'

  const { user, fetchUser } = useUserStore()
  fetchUser()

  // Maps this form's own reason dropdown onto the shared branch-field keys —
  // see ReasonBranchFields.vue. "Competitor" here is a distinct branch
  // (Why Did Client Choose Competitor?) from the "Lost To Competitor" outcome
  // below, so it gets its own key even though both eventually feed the same
  // Competitor Name field.
  const REASON_STOPPED_TO_BRANCH = {
    Price: 'price',
    Competitor: 'competitorChoice',
    'No Current Need': 'noNeed',
    'Internal Maintenance': 'internalMaintenance',
    'Bad Service Experience': 'badService',
    'Location / Coverage': 'location',
    'Service Availability': 'serviceAvailability',
    'Billing / Payment': 'billing',
    'Driver Related': 'driver',
    'Communication / Trust': 'communication',
    'Company / Management': 'company'
  }

  // Outcomes that end Re-engagement by moving the client into Churned.
  // Values map to the closest matching Churn Reason — most are identical
  // labels, "Out Of Business" is the one exception (Churned calls it
  // "Business Closed").
  const CHURN_REASON_BY_OUTCOME = {
    'Lost To Competitor': 'Lost To Competitor',
    'Hard Refusal': 'Hard Refusal',
    'Out Of Business': 'Business Closed'
  }

  const isLoading = ref(false)
  const nextActionDate = ref('')

  const reasonStopped = ref('')
  const reasonBranchRef = ref(null)
  const reasonBranch = computed(
    () => REASON_STOPPED_TO_BRANCH[reasonStopped.value] || ''
  )

  const competitorName = ref('')
  const whyCompetitorWon = ref('')

  const whatCanBringBack = ref([])
  const targetService = ref([])
  const returnPotential = ref('')
  const reEngagementStatus = ref('')

  const isClosingReEngagement = ref('')
  const reEngagementOutcome = ref('')
  const whatBroughtClientBack = ref([])
  const whyNotNow = ref('')

  const opensChurnedForm = computed(
    () => !!CHURN_REASON_BY_OUTCOME[reEngagementOutcome.value]
  )

  async function createReEngagementTouchpoint() {
    isLoading.value = true
    const resolvedOutcome =
      isClosingReEngagement.value === 'Yes' ? reEngagementOutcome.value : ''
    const branchFields = reasonBranchRef.value?.getApiFields() || {}

    const reEngagementFields = {
      Maintenance_Offers: appState.value.entityId,
      Conversation_Type: appState.value.conversationType,
      Call_Outcome: appState.value.callOutcome,
      Next_Action_Date: nextActionDate.value,
      Owner: user.value?.id || '',

      Reason_Stopped: reasonStopped.value,
      ...branchFields,
      // The "Lost To Competitor" outcome below can supply Competitor Name /
      // Why Competitor Won independently of the reason branch above — prefer
      // whichever one is actually active.
      Competitor_Name:
        branchFields.Competitor_Name ||
        (resolvedOutcome === 'Lost To Competitor' ? competitorName.value : ''),
      Why_Competitor_Won:
        resolvedOutcome === 'Lost To Competitor'
          ? whyCompetitorWon.value
          : branchFields.Why_Competitor_Won || '',

      What_Can_Bring_Client_Back: whatCanBringBack.value,
      Target_Service: targetService.value,
      Return_Potential: returnPotential.value,
      Re_Engagement_Status: reEngagementStatus.value,

      Re_Engagement_Outcome: resolvedOutcome,
      What_Brought_Client_Back:
        resolvedOutcome === 'Reactivated' ? whatBroughtClientBack.value : [],
      Why_Not_Now: resolvedOutcome === 'Not Now' ? whyNotNow.value : '',
      Contactability: resolvedOutcome === 'Unable To Reach' ? 'Unreachable' : ''
    }
    const churnReason = CHURN_REASON_BY_OUTCOME[resolvedOutcome]
    if (churnReason) {
      // This outcome ends Re-engagement as Churned. Don't create a
      // Re-engagement touchpoint at all — hand everything collected so far
      // off to the Churned form, which creates a single merged touchpoint
      // once the agent finishes and submits there.
      setHandoffData({
        churnReason,
        competitorName: reEngagementFields.Competitor_Name,
        whyCompetitorWon: reEngagementFields.Why_Competitor_Won,
        reEngagementFields
      })
      appState.value.conversationType = 'Churned Feedback'
      appState.value.page = 'churned-feedback'
      isLoading.value = false
      return
    }
    await createTouchpoint(reEngagementFields).finally(() => {
      isLoading.value = false
    })

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>

<style scoped>
  .zp-handoff-note {
    margin: -8px 0 20px;
    padding: 8px 12px;
    border-radius: 4px;
    background: var(--color-accent-soft);
    color: var(--color-text-secondary);
    font-size: 13px;
  }
</style>
