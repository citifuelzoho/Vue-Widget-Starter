<template>
  <form @submit.prevent="createActiveClientFeedbackTouchpoint">
    <BaseSelect
      id="overall-experience"
      label="Overall Experience"
      v-model="appState.overallExperience"
      :options="OverallExperienceOptions"
      placeholder="Select overall experience"
      :required="true"
    />

    <BaseMultiSelect
      id="client-likes"
      label="What Client Likes About Truck.me"
      v-model="appState.clientLikes"
      :options="ClientLikesOptions"
      :required="true"
    />

    <BaseSelect
      id="main-reason"
      label="Main Reason Client Continues Using Truck.me"
      v-model="appState.mainReason"
      :options="MainReasonOptions"
      placeholder="Select main reason"
      :required="true"
    />

    <BaseSelect
      id="has-concerns"
      label="Does Client Have Any Concerns?"
      v-model="appState.hasConcerns"
      :options="HasConcernsOptions"
      placeholder="Select an option"
      :required="true"
    />

    <BaseSelect
      v-if="appState.hasConcerns === 'Yes'"
      id="primary-concern"
      label="Primary Concern"
      v-model="appState.primaryConcern"
      :options="PrimaryConcernOptions"
      placeholder="Select primary concern"
      :required="true"
    />

    <template v-if="appState.primaryConcern === 'Price'">
      <BaseSelect
        id="price-issue"
        label="What Is The Price Issue?"
        v-model="appState.priceIssue"
        :options="PriceIssueOptions"
        placeholder="Select price issue"
        :required="true"
      />

      <template v-if="appState.priceIssue === 'Competitor Is Cheaper'">
        <BaseInput
          id="competitor-name"
          label="Competitor Name"
          v-model="appState.competitorName"
          :required="true"
        />

        <BaseSelect
          id="estimated-price-difference"
          label="Estimated Price Difference"
          v-model="appState.estimatedPriceDifference"
          :options="EstimatedPriceDifferenceOptions"
          placeholder="Select estimated price difference"
          :required="true"
        />
      </template>
    </template>

    <template v-if="appState.primaryConcern === 'Competitor'">
      <BaseSelect
        id="competitor-preference-reason"
        label="Why Does Client Prefer Competitor?"
        v-model="appState.competitorPreferenceReason"
        :options="CompetitorPreferenceReasonOptions"
        placeholder="Select reason"
        :required="true"
      />

      <BaseInput
        id="competitor-name"
        label="Competitor Name"
        v-model="appState.competitorName"
        :required="true"
      />
    </template>

    <template v-if="appState.primaryConcern === 'Location / Coverage'">
      <BaseSelect
        id="location-problem"
        label="What Is The Location Problem?"
        v-model="appState.locationProblem"
        :options="LocationProblemOptions"
        placeholder="Select location problem"
        :required="true"
      />

      <BaseSelect
        id="needed-state"
        label="Needed State"
        v-model="appState.neededState"
        :options="USStateOptions"
        placeholder="Select needed state"
        :required="true"
      />

      <BaseInput
        id="needed-city"
        label="Needed City / Area"
        v-model="appState.neededCity"
        :required="true"
      />

      <BaseInput
        id="suggested-shop"
        label="Suggested Shop"
        v-model="appState.suggestedShop"
        :required="true"
      />
    </template>

    <BaseSelect
      v-if="appState.primaryConcern === 'Service Availability'"
      id="service-availability-problem"
      label="What Is The Service Availability Problem?"
      v-model="appState.serviceAvailabilityProblem"
      :options="ServiceAvailabilityProblemOptions"
      placeholder="Select service availability problem"
      :required="true"
    />

    <template v-if="appState.primaryConcern === 'Bad Service Experience'">
      <BaseSelect
        id="service-issue"
        label="What Went Wrong?"
        v-model="appState.serviceIssue"
        :options="ServiceIssueOptions"
        placeholder="Select what went wrong"
        :required="true"
      />

      <BaseSelect
        id="related-service"
        label="Related Service"
        v-model="appState.relatedService"
        :options="RelatedServiceOptions"
        placeholder="Select related service"
        :required="true"
      />

      <BaseInput
        id="shop-name"
        label="Shop Name"
        v-model="appState.shopName"
        :required="true"
      />

      <BaseSelect
        id="issue-severity"
        label="Issue Severity"
        v-model="appState.issueSeverity"
        :options="IssueSeverityOptions"
        placeholder="Select issue severity"
        :required="true"
      />
    </template>

    <BaseSelect
      v-if="appState.primaryConcern === 'Billing / Payment'"
      id="billing-issue"
      label="What Is The Billing Issue?"
      v-model="appState.billingIssue"
      :options="BillingIssueOptions"
      placeholder="Select billing issue"
      :required="true"
    />

    <BaseSelect
      v-if="appState.primaryConcern === 'Communication'"
      id="communication-issue"
      label="What Is The Communication Issue?"
      v-model="appState.communicationIssue"
      :options="CommunicationIssueOptions"
      placeholder="Select communication issue"
      :required="true"
    />

    <BaseSelect
      v-if="appState.primaryConcern === 'Driver Experience'"
      id="driver-issue"
      label="What Is The Driver Issue?"
      v-model="appState.driverIssue"
      :options="DriverIssueOptions"
      placeholder="Select driver issue"
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
  import BaseMultiSelect from '../BaseMultiSelect.vue'
  import BaseInput from '../BaseInput.vue'
  import BaseButton from '../BaseButton.vue'
  import { appState } from '../../store'
  import {
    OverallExperienceOptions,
    ClientLikesOptions,
    MainReasonOptions,
    HasConcernsOptions,
    PrimaryConcernOptions,
    PriceIssueOptions,
    EstimatedPriceDifferenceOptions,
    CompetitorPreferenceReasonOptions,
    LocationProblemOptions,
    USStateOptions,
    ServiceAvailabilityProblemOptions,
    ServiceIssueOptions,
    RelatedServiceOptions,
    IssueSeverityOptions,
    BillingIssueOptions,
    CommunicationIssueOptions,
    DriverIssueOptions
  } from '../../config/select-options'
  import { createTouchpoint } from '../../utils/touchpoint'
  import { andSymbolEncode } from '../../utils/andSymbolEncode'

  const isLoading = ref(false)

  async function createActiveClientFeedbackTouchpoint() {
    isLoading.value = true

    const primaryConcern =
      appState.value.hasConcerns === 'Yes' ? appState.value.primaryConcern : ''
    const isCompetitorCheaper =
      primaryConcern === 'Price' &&
      appState.value.priceIssue === 'Competitor Is Cheaper'

    const apiData = {
      Maintenance_Offers: appState.value.entityId,
      Conversation_Type: appState.value.conversationType,
      Call_Outcome: appState.value.callOutcome,
      Overall_Experience: appState.value.overallExperience,
      Client_Likes: appState.value.clientLikes.map(e => andSymbolEncode(e)),
      Main_Reason: appState.value.mainReason,
      Has_Concerns: appState.value.hasConcerns,
      Primary_Concern: primaryConcern,
      Price_Issue: primaryConcern === 'Price' ? appState.value.priceIssue : '',
      Competitor_Name:
        isCompetitorCheaper || primaryConcern === 'Competitor'
          ? appState.value.competitorName
          : '',
      Estimated_Price_Difference: isCompetitorCheaper
        ? appState.value.estimatedPriceDifference
        : '',
      Competitor_Preference_Reason:
        primaryConcern === 'Competitor'
          ? appState.value.competitorPreferenceReason
          : '',
      Location_Problem:
        primaryConcern === 'Location / Coverage'
          ? appState.value.locationProblem
          : '',
      Needed_State:
        primaryConcern === 'Location / Coverage'
          ? appState.value.neededState
          : '',
      Needed_City:
        primaryConcern === 'Location / Coverage'
          ? appState.value.neededCity
          : '',
      Suggested_Shop:
        primaryConcern === 'Location / Coverage'
          ? appState.value.suggestedShop
          : '',
      Service_Availability_Problem:
        primaryConcern === 'Service Availability'
          ? appState.value.serviceAvailabilityProblem
          : '',
      Service_Issue:
        primaryConcern === 'Bad Service Experience'
          ? appState.value.serviceIssue
          : '',
      Related_Service:
        primaryConcern === 'Bad Service Experience'
          ? appState.value.relatedService
          : '',
      Shop_Name:
        primaryConcern === 'Bad Service Experience'
          ? appState.value.shopName
          : '',
      Issue_Severity:
        primaryConcern === 'Bad Service Experience'
          ? appState.value.issueSeverity
          : '',
      Billing_Issue:
        primaryConcern === 'Billing / Payment'
          ? appState.value.billingIssue
          : '',
      Communication_Issue:
        primaryConcern === 'Communication'
          ? appState.value.communicationIssue
          : '',
      Driver_Issue:
        primaryConcern === 'Driver Experience'
          ? appState.value.driverIssue
          : ''
    }

    await createTouchpoint(apiData).finally(() => {
      isLoading.value = false
    })

    alert('Touchpoint created successfully.')
    setTimeout(() => ZOHO.CRM.UI.Popup.closeReload(), 1000)
  }
</script>
