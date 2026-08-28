<template>
  <form @submit.prevent="createChurnedTouchpoint">
    <p v-if="cameFromReEngagement" class="zp-handoff-note">
      Picking up from the Re-engagement call — the reason and any known
      competitor details are already filled in below, and everything from that
      call will be saved together with this form as one record. Update anything
      that's changed before continuing.
    </p>

    <BaseSelect
      id="churn-reason"
      label="Churn Reason"
      v-model="churnReason"
      :options="ChurnReasonOptions"
      placeholder="Select a reason"
      :required="true"
    />

    <ReasonBranchFields
      :branch="churnBranch"
      v-model:competitor-name="competitorName"
      v-model:why-competitor-won="whyCompetitorWon"
      ref="reasonBranchRef"
    />

    <BaseMultiSelect
      id="lost-services"
      label="Lost Services"
      v-model="lostServices"
      :options="LostServicesOptions"
      :required="true"
    />

    <BaseSelect
      id="return-possibility"
      label="Return Possibility"
      v-model="returnPossibility"
      :options="ReturnPossibilityOptions"
      placeholder="Select return possibility"
      :required="true"
    />

    <p
      v-if="showWhatCouldBringBack && previousWhatCanBringBack.length"
      class="zp-handoff-note"
    >
      During the Re-engagement call, "What Can Bring Client Back?" was answered:
      {{ previousWhatCanBringBack.join(', ') }}. Consider whether the same
      things still apply here.
    </p>

    <BaseMultiSelect
      v-if="showWhatCouldBringBack"
      id="what-could-bring-back"
      label="What Could Bring Client Back?"
      v-model="whatCouldBringBack"
      :options="WhatCouldBringChurnedBackOptions"
      :required="true"
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
    ChurnReasonOptions,
    LostServicesOptions,
    ReturnPossibilityOptions,
    WhatCouldBringChurnedBackOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { useUserStore } from '../../store/user'
  import { consumeHandoffData } from '../../store/handoff'

  const { user, fetchUser } = useUserStore()
  fetchUser()

  // Picked up when this form was opened right after a Re-engagement call
  // closed out as Churned — see ReEngagementForm's createReEngagementTouchpoint.
  const incomingHandoff = consumeHandoffData()
  const cameFromReEngagement = !!incomingHandoff

  // Re-engagement and Churned ask essentially the same "how likely to come
  // back" question via two different fields with two different value sets
  // (Return_Potential vs Return_Possibility) — without this mapping, a
  // handed-off record could carry e.g. Return_Potential: High from the
  // Re-engagement call alongside a freshly-picked Return_Possibility: No
  // Chance on the exact same touchpoint, with nothing to reconcile them.
  // Pre-filling (same treatment as churnReason/competitorName below) means
  // the agent sees and can adjust the carried-over value instead of
  // re-answering from scratch or silently contradicting it.
  const RETURN_POTENTIAL_TO_POSSIBILITY = {
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
    'No Potential': 'No Chance',
    Unknown: 'Unknown'
  }

  // Maps this form's own reason dropdown onto the shared branch-field keys —
  // see ReasonBranchFields.vue.
  const CHURN_REASON_TO_BRANCH = {
    Price: 'price',
    'Lost To Competitor': 'lostToCompetitor',
    'Bad Service Experience': 'badService',
    'No Current Need': 'noNeed',
    'Internal Maintenance': 'internalMaintenance',
    'Location / Coverage': 'location',
    'Service Availability': 'serviceAvailability',
    'Billing / Payment': 'billing',
    'Communication / Trust': 'communication',
    'Driver Related': 'driver',
    'Company / Management': 'company'
  }

  const isLoading = ref(false)
  const nextActionDate = ref('')

  const churnReason = ref(incomingHandoff?.churnReason || '')
  const reasonBranchRef = ref(null)
  const churnBranch = computed(
    () => CHURN_REASON_TO_BRANCH[churnReason.value] || ''
  )

  const competitorName = ref(incomingHandoff?.competitorName || '')
  const whyCompetitorWon = ref(incomingHandoff?.whyCompetitorWon || '')

  const lostServices = ref([])
  const returnPossibility = ref(
    RETURN_POTENTIAL_TO_POSSIBILITY[
      incomingHandoff?.reEngagementFields?.Return_Potential
    ] || ''
  )
  const whatCouldBringBack = ref([])

  // Shown as context next to What Could Bring Client Back, not auto-filled —
  // that field's option list doesn't map cleanly onto Re-engagement's (see
  // option_lists_index in PROJECT_STATE.json), so rather than build a lossy
  // value-mapping table, just let the agent see what was said before and
  // make a fresh, deliberate call informed by it.
  const previousWhatCanBringBack =
    incomingHandoff?.reEngagementFields?.What_Can_Bring_Client_Back || []

  // "What Could Bring Client Back?" only applies while there's some chance of
  // winning the client back — hidden for "No Chance" and until a possibility
  // has been picked at all.
  const showWhatCouldBringBack = computed(() =>
    ['High', 'Medium', 'Low'].includes(returnPossibility.value)
  )

  async function createChurnedTouchpoint() {
    isLoading.value = true

    const branchFields = reasonBranchRef.value?.getApiFields() || {}

    const apiData = {
      // Anything already known from a Re-engagement call this session came
      // from goes first, so this form's own fields below always win on any
      // overlapping key (Conversation_Type, Next_Action_Date, etc.) — this
      // call's answers are the most current ones.
      ...(incomingHandoff?.reEngagementFields || {}),

      Maintenance_Offers: appState.value.entityId,
      Conversation_Type: appState.value.conversationType,
      Call_Outcome: appState.value.callOutcome,
      Next_Action_Date: nextActionDate.value,
      Owner: user.value?.id || '',

      Churn_Reason: churnReason.value,
      ...branchFields,

      Lost_Services: lostServices.value,
      Return_Possibility: returnPossibility.value,
      What_Could_Bring_Client_Back: showWhatCouldBringBack.value
        ? whatCouldBringBack.value
        : []
    }

    await createTouchpoint(apiData).finally(() => {
      isLoading.value = false
    })

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>

<style scoped>
  .zp-handoff-note {
    margin: 0 0 20px;
    padding: 8px 12px;
    border-radius: 4px;
    background: var(--color-accent-soft);
    color: var(--color-text-secondary);
    font-size: 13px;
  }
</style>
