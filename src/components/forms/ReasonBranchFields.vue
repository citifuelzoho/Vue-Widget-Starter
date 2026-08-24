<!--
  Shared conditional-field tree for "why did the client stop / churn"
  reasons. ReEngagementForm and ChurnedFeedbackForm each define their own
  top-level reason dropdown (different values, mostly-matching labels — see
  ReasonStoppedOptions vs ChurnReasonOptions) and map their selected reason
  to one of the branch keys below via a small local lookup object, then
  mount this component once and read its fields back through getApiFields()
  at submit time. This keeps the actual field set defined in exactly one
  place, per the "don't create duplicate fields" requirement both forms
  were built against.

  competitorName / whyCompetitorWon are lifted to the parent (via
  v-model) rather than owned here, since both forms need to read or seed
  them from outside this component: ReEngagementForm reuses competitorName
  for its own "Lost To Competitor" outcome fields, and ChurnedFeedbackForm
  pre-fills both from a Re-engagement hand-off.

  ActiveClientFeedbackForm also mounts this component for its "Primary
  Concern" tree — most branches match exactly, including Related Service
  (both this tree and Active Client Feedback use ServicesDiscussedOptions
  for it). Communication is the one branch that's genuinely different
  content between the two: Active Client Feedback's version is about
  support responsiveness, Re-engagement/Churned's is about trust — not
  just different wording. Rather than force both into one Zoho field with
  a blended value list, this branch writes to a *different field name*
  depending on the caller (`communicationFieldKey` prop), and shows a
  different option list to match (`communicationOptions` prop).
-->
<template>
  <template v-if="branch === 'price'">
    <BaseSelect
      id="price-issue"
      label="What Is The Price Issue?"
      v-model="priceIssue"
      :options="PriceIssueOptions"
      placeholder="Select price issue"
      :required="true"
    />

    <template v-if="priceIssue === 'Competitor Is Cheaper'">
      <BaseInput
        id="competitor-name"
        label="Competitor Name"
        v-model="competitorName"
        :required="true"
      />

      <BaseSelect
        id="estimated-price-difference"
        label="Estimated Price Difference"
        v-model="estimatedPriceDifference"
        :options="EstimatedPriceDifferenceOptions"
        placeholder="Select estimated price difference"
        :required="true"
      />
    </template>
  </template>

  <template v-if="branch === 'competitorChoice'">
    <BaseSelect
      id="competitor-choice-reason"
      label="Why Did Client Choose Competitor?"
      v-model="competitorChoiceReason"
      :options="CompetitorReasonOptions"
      placeholder="Select reason"
      :required="true"
    />

    <BaseInput
      id="competitor-name"
      label="Competitor Name"
      v-model="competitorName"
      :required="true"
    />
  </template>

  <template v-if="branch === 'lostToCompetitor'">
    <BaseInput
      id="competitor-name"
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

  <BaseSelect
    v-if="branch === 'noNeed'"
    id="no-current-need-reason"
    label="Why No Current Need?"
    v-model="noCurrentNeedReason"
    :options="NoCurrentNeedOptions"
    placeholder="Select reason"
    :required="true"
  />

  <BaseSelect
    v-if="branch === 'internalMaintenance'"
    id="internal-maintenance-method"
    label="How Does Client Handle Maintenance?"
    v-model="internalMaintenanceMethod"
    :options="InternalMaintenanceOptions"
    placeholder="Select an option"
    :required="true"
  />

  <template v-if="branch === 'badService'">
    <BaseSelect
      id="service-issue"
      label="What Went Wrong?"
      v-model="serviceIssue"
      :options="ServiceIssueOptions"
      placeholder="Select what went wrong"
      :required="true"
    />

    <BaseSelect
      id="related-service"
      label="Related Service"
      v-model="relatedService"
      :options="RelatedServiceOptions"
      placeholder="Select related service"
      :required="true"
    />

    <BaseInput
      id="shop-name"
      label="Shop Name"
      v-model="shopName"
      :required="true"
    />

    <BaseSelect
      id="issue-severity"
      label="Issue Severity"
      v-model="issueSeverity"
      :options="IssueSeverityOptions"
      placeholder="Select issue severity"
      :required="true"
    />
  </template>

  <template v-if="branch === 'location'">
    <BaseSelect
      id="location-problem"
      label="What Is The Location Problem?"
      v-model="locationProblem"
      :options="LocationProblemOptions"
      placeholder="Select location problem"
      :required="true"
    />

    <BaseSelect
      id="needed-state"
      label="Needed State"
      v-model="neededState"
      :options="USStateOptions"
      placeholder="Select needed state"
      :required="true"
    />

    <BaseInput
      id="needed-city"
      label="Needed City / Area"
      v-model="neededCity"
      :required="true"
    />

    <BaseInput
      id="suggested-shop"
      label="Suggested Shop"
      v-model="suggestedShop"
      :required="true"
    />
  </template>

  <BaseSelect
    v-if="branch === 'serviceAvailability'"
    id="service-availability-problem"
    label="What Is The Problem?"
    v-model="serviceAvailabilityProblem"
    :options="ServiceAvailabilityProblemOptions"
    placeholder="Select the problem"
    :required="true"
  />

  <BaseSelect
    v-if="branch === 'billing'"
    id="billing-issue"
    label="What Is The Billing Issue?"
    v-model="billingIssue"
    :options="BillingIssueOptions"
    placeholder="Select billing issue"
    :required="true"
  />

  <BaseSelect
    v-if="branch === 'communication'"
    id="communication-trust-issue"
    label="What Is The Problem?"
    v-model="communicationTrustIssue"
    :options="communicationOptions"
    placeholder="Select the problem"
    :required="true"
  />

  <BaseSelect
    v-if="branch === 'driver'"
    id="driver-issue"
    label="What Is The Driver Issue?"
    v-model="driverIssue"
    :options="DriverIssueOptions"
    placeholder="Select driver issue"
    :required="true"
  />

  <BaseSelect
    v-if="branch === 'company'"
    id="company-change"
    label="What Changed?"
    v-model="companyChange"
    :options="CompanyManagementChangeOptions"
    placeholder="Select what changed"
    :required="true"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import BaseSelect from '../BaseSelect.vue'
  import BaseInput from '../BaseInput.vue'
  import {
    PriceIssueOptions,
    EstimatedPriceDifferenceOptions,
    CompetitorReasonOptions,
    NoCurrentNeedOptions,
    InternalMaintenanceOptions,
    ServiceIssueOptions,
    RelatedServiceOptions,
    IssueSeverityOptions,
    LocationProblemOptions,
    USStateOptions,
    ServiceAvailabilityProblemOptions,
    BillingIssueOptions,
    ReEngagementCommunicationOptions,
    DriverIssueOptions,
    CompanyManagementChangeOptions
  } from '../../config/select-options'

  const props = defineProps({
    branch: {
      type: String,
      default: ''
    },
    // Override for the "What Is The Problem?" list under Communication /
    // Trust — defaults to ReEngagementCommunicationOptions;
    // ActiveClientFeedbackForm passes its own CommunicationIssueOptions
    // instead.
    communicationOptions: {
      type: Array,
      default: () => ReEngagementCommunicationOptions
    },
    // The Zoho field name the communication branch's answer is written
    // under — defaults to Re-engagement/Churned's Communication_Trust_Issue;
    // ActiveClientFeedbackForm passes 'Communication_Issue' instead, since
    // it's a genuinely different question, not just different wording (see
    // the note above the template).
    communicationFieldKey: {
      type: String,
      default: 'Communication_Trust_Issue'
    }
  })

  const competitorName = defineModel('competitorName', {
    type: String,
    default: ''
  })
  const whyCompetitorWon = defineModel('whyCompetitorWon', {
    type: String,
    default: ''
  })

  const priceIssue = ref('')
  const estimatedPriceDifference = ref('')
  const competitorChoiceReason = ref('')
  const noCurrentNeedReason = ref('')
  const internalMaintenanceMethod = ref('')
  const serviceIssue = ref('')
  const relatedService = ref('')
  const shopName = ref('')
  const issueSeverity = ref('')
  const locationProblem = ref('')
  const neededState = ref('')
  const neededCity = ref('')
  const suggestedShop = ref('')
  const serviceAvailabilityProblem = ref('')
  const billingIssue = ref('')
  const communicationTrustIssue = ref('')
  const driverIssue = ref('')
  const companyChange = ref('')

  // Returns every field this tree can produce, already resolved to '' for
  // whichever ones don't apply to the active branch — callers can spread the
  // result straight into their apiData with no extra guard logic.
  function getApiFields() {
    const isCompetitorCheaper =
      props.branch === 'price' && priceIssue.value === 'Competitor Is Cheaper'

    return {
      Price_Issue: props.branch === 'price' ? priceIssue.value : '',
      Competitor_Name:
        isCompetitorCheaper ||
        props.branch === 'competitorChoice' ||
        props.branch === 'lostToCompetitor'
          ? competitorName.value
          : '',
      Estimated_Price_Difference: isCompetitorCheaper
        ? estimatedPriceDifference.value
        : '',
      Competitor_Choice_Reason:
        props.branch === 'competitorChoice' ? competitorChoiceReason.value : '',
      Why_Competitor_Won:
        props.branch === 'lostToCompetitor' ? whyCompetitorWon.value : '',
      No_Current_Need_Reason:
        props.branch === 'noNeed' ? noCurrentNeedReason.value : '',
      Internal_Maintenance_Method:
        props.branch === 'internalMaintenance'
          ? internalMaintenanceMethod.value
          : '',
      Service_Issue: props.branch === 'badService' ? serviceIssue.value : '',
      Related_Service:
        props.branch === 'badService' ? relatedService.value : '',
      Shop_Name: props.branch === 'badService' ? shopName.value : '',
      Issue_Severity: props.branch === 'badService' ? issueSeverity.value : '',
      Location_Problem:
        props.branch === 'location' ? locationProblem.value : '',
      Needed_State: props.branch === 'location' ? neededState.value : '',
      Needed_City: props.branch === 'location' ? neededCity.value : '',
      Suggested_Shop: props.branch === 'location' ? suggestedShop.value : '',
      Service_Availability_Problem:
        props.branch === 'serviceAvailability'
          ? serviceAvailabilityProblem.value
          : '',
      Billing_Issue: props.branch === 'billing' ? billingIssue.value : '',
      [props.communicationFieldKey]:
        props.branch === 'communication' ? communicationTrustIssue.value : '',
      Driver_Issue: props.branch === 'driver' ? driverIssue.value : '',
      Company_Change: props.branch === 'company' ? companyChange.value : ''
    }
  }

  defineExpose({ getApiFields })
</script>
