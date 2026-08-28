<template>
  <form @submit.prevent="createIntroTouchpoint">
    <h3 class="zp-section-heading">Company Information</h3>
    <div class="zp-two-column">
      <div class="zp-column">
        <BaseSelect
          id="account-type"
          label="Account Type"
          v-model="accountType"
          :options="AccountTypeOptions"
          placeholder="Select account type"
        />

        <BaseInput
          id="fleet-size"
          label="Fleet Size"
          v-model="fleetSize"
          type="number"
        />

        <BaseSelect
          id="estimated-monthly-mileage"
          label="Estimated Monthly Mileage"
          v-model="estimatedMonthlyMileage"
          :options="EstimatedMonthlyMileageOptions"
          placeholder="Select estimated monthly mileage"
        />

        <BaseSelect
          id="introduction-source"
          label="Introduction Source"
          v-model="introductionSource"
          :options="IntroductionSourceOptions"
          placeholder="Select introduction source"
        />

        <BaseSelect
          id="informed-by-fuel-sales"
          label="Informed about TruckMe By Fuel Sales"
          v-model="informedByFuelSales"
          :options="InformedByFuelSalesOptions"
          placeholder="Select an option"
        />
      </div>

      <div class="zp-column">
        <BaseMultiSelect
          id="preferred-language"
          label="Preferred Language"
          v-model="preferredLanguage"
          :options="PreferredLanguageOptions"
        />

        <BaseInput
          v-if="preferredLanguage.includes('Other')"
          id="other-language"
          label="Other Language"
          v-model="otherLanguage"
        />

        <BaseMultiSelect
          id="preferred-communication"
          label="Preferred Communication"
          v-model="preferredCommunication"
          :options="PreferredCommunicationOptions"
        />

        <BaseMultiSelect
          id="main-decision-maker"
          label="Main Decision Maker"
          v-model="mainDecisionMaker"
          :options="MainDecisionMakerOptions"
        />

        <BaseInput
          id="tg-group-link"
          label="TG Group Link"
          v-model="tgGroupLink"
          type="url"
        />
      </div>
    </div>

    <h3 class="zp-section-heading">Call Details</h3>
    <BaseSelect
      id="client-reaction"
      label="Client reaction"
      v-model="clientReaction"
      :options="ClientReactionOptions"
      placeholder="Select a client reaction"
      :required="true"
    />

    <BaseSelect
      v-if="clientReaction === 'Refused'"
      id="refusal-reason"
      label="Refusal reason"
      v-model="refusalReason"
      :options="RefusalReasonOptions"
      placeholder="Select a refusal reason"
      :required="true"
    />

    <BaseSelect
      v-if="clientReaction === 'Refused'"
      id="refusal-confidence"
      label="Refusal confidence"
      v-model="refusalConfidence"
      :options="RefusalConfidenceOptions"
      placeholder="Select a refusal confidence"
      :required="true"
    />

    <BaseMultiSelect
      id="services-discussed"
      label="Services Discussed"
      v-model="servicesDiscussed"
      :options="ServicesDiscussedOptions"
      :required="true"
    />

    <BaseTextarea
      id="summary-notes"
      label="Summary Notes"
      v-model="summaryNotes"
      placeholder="Enter summary notes"
      :rows="5"
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
    ServicesDiscussedOptions,
    AccountTypeOptions,
    EstimatedMonthlyMileageOptions,
    IntroductionSourceOptions,
    InformedByFuelSalesOptions,
    PreferredLanguageOptions,
    PreferredCommunicationOptions,
    MainDecisionMakerOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { updateMaintenanceOffer } from '../../utils/maintenanceOffer'
  import { useUserStore } from '../../store/user'
  import { useMaintenanceOfferStore } from '../../store/maintenanceOffer'

  const isLoading = ref(false)
  const clientReaction = ref('')
  const refusalReason = ref('')
  const refusalConfidence = ref('')
  const nextActionDate = ref('')
  const servicesDiscussed = ref([])
  const summaryNotes = ref('')
  const { user, fetchUser } = useUserStore()
  fetchUser()

  // Company Information section — fields that live on the Maintenance Offer
  // (Maintenance_Sales) record itself, not on the touchpoint. Populated on
  // form start-up from the current record, and written back to that record
  // (not the touchpoint) before the touchpoint is created — see
  // createIntroTouchpoint below.
  const accountType = ref('')
  const fleetSize = ref('')
  const estimatedMonthlyMileage = ref('')
  const introductionSource = ref('')
  const informedByFuelSales = ref('')
  const preferredLanguage = ref([])
  const otherLanguage = ref('')
  const preferredCommunication = ref([])
  const mainDecisionMaker = ref([])
  const tgGroupLink = ref('')

  const { maintenanceOffer, fetchMaintenanceOffer } = useMaintenanceOfferStore()
  fetchMaintenanceOffer().then(() => {
    const offer = maintenanceOffer.value
    if (!offer) return
    accountType.value = offer.Account_Type || ''
    fleetSize.value = offer.Fleet_Size ?? ''
    estimatedMonthlyMileage.value = offer.Estimated_Monthly_Mileage || ''
    introductionSource.value = offer.Introduction_Source || ''
    informedByFuelSales.value = offer.Informed_about_TruckMe_By_Fuel_Sales || ''
    preferredLanguage.value = offer.Preferred_Language || []
    otherLanguage.value = offer.Other_Language || ''
    preferredCommunication.value = offer.Preferred_Communication || []
    mainDecisionMaker.value = offer.Main_Decision_Maker || []
    tgGroupLink.value = offer.TG_Group_Link || ''
  })

  async function createIntroTouchpoint() {
    isLoading.value = true

    try {
      const maintenanceOfferFields = {
        Account_Type: accountType.value,
        Fleet_Size: fleetSize.value,
        Estimated_Monthly_Mileage: estimatedMonthlyMileage.value,
        Introduction_Source: introductionSource.value,
        Informed_about_TruckMe_By_Fuel_Sales: informedByFuelSales.value,
        Preferred_Language: preferredLanguage.value,
        Other_Language: preferredLanguage.value.includes('Other')
          ? otherLanguage.value
          : '',
        Preferred_Communication: preferredCommunication.value,
        Main_Decision_Maker: mainDecisionMaker.value,
        TG_Group_Link: tgGroupLink.value
      }

      // Update the Maintenance Offer record BEFORE creating the touchpoint —
      // these fields live on that record, not on Maintenance_Touchpoints.
      await updateMaintenanceOffer(
        appState.value.entityId,
        maintenanceOfferFields
      )

      const apiData = {
        Maintenance_Offers: appState.value.entityId,
        Conversation_Type: appState.value.conversationType,
        Call_Outcome: appState.value.callOutcome,
        Client_Reaction: clientReaction.value,
        Refusal_Reason:
          clientReaction.value === 'Refused' ? refusalReason.value : '',
        Refusal_Confidence:
          clientReaction.value === 'Refused' ? refusalConfidence.value : '',
        Next_Action_Date: nextActionDate.value,
        Services_Discussed: servicesDiscussed.value,
        Summary_Notes: summaryNotes.value,
        Owner: user.value?.id || ''
      }

      await createTouchpoint(apiData)
    } finally {
      isLoading.value = false
    }

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>

<style scoped>
  .zp-section-heading {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }

  .zp-two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 32px;
    margin-bottom: 12px;
  }

  /* Label-above-input, only within this section — BaseSelect/BaseInput/
     BaseMultiSelect normally lay out label+control side by side with a
     fixed 160px label column; overriding that here via :deep() rather than
     changing those shared components, so every other form is unaffected. */
  .zp-two-column :deep(.zp-section) {
    flex-direction: column;
    align-items: stretch;
  }

  .zp-two-column :deep(.zp-select-label),
  .zp-two-column :deep(.zp-field-label) {
    width: auto;
    padding-top: 0;
    margin-bottom: 6px;
  }

  @media (max-width: 640px) {
    .zp-two-column {
      grid-template-columns: 1fr;
    }
  }
</style>
