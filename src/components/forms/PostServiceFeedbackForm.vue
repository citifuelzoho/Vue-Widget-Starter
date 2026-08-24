<template>
  <form @submit.prevent="submitPostServiceFeedback">
    <BaseSelect id="service-satisfaction" label="Service Satisfaction" v-model="serviceSatisfaction"
      :options="ServiceSatisfactionOptions" placeholder="Select service satisfaction" :required="true" />

    <BaseSelect id="will-use-again" label="Will Use Again" v-model="willUseAgain" :options="WillUseAgainOptions"
      placeholder="Select will use again" :required="true" />

    <TablePagination :limit="reqLimit" :limit-options="RequestLimitOptions" :page="reqPage" :disable-next="!canGoNext"
      @update:limit="handleLimitChange" @prev="goToPrevPage" @next="goToNextPage" />

    <div class="request-table-wrapper">
      <table class="request-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
            </th>
            <th v-for="column in TABLE_COLUMNS" :key="column">
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="isFetchingRequests">
            <tr>
              <td class="request-table-status" :colspan="TABLE_COLUMNS.length + 1">
                <span class="spinner" aria-hidden="true"></span>
                Loading requests…
              </td>
            </tr>
          </template>
          <template v-else-if="!reqData.length">
            <tr>
              <td class="request-table-status" :colspan="TABLE_COLUMNS.length + 1">
                No Maintenance Requests found
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="request in reqData" :key="request.id || JSON.stringify(request)"
              :class="{ 'is-selected': selectedRequests.includes(request.id) }">
              <td>
                <input type="checkbox" :value="request.id" v-model="selectedRequests" />
              </td>
              <td>{{ request.Name }}</td>
              <td>{{ request.Used_Date }}</td>
              <td>{{ request.Shop_Name?.name }}</td>
              <td>{{ request.Service_Type }}</td>
              <td>
                <ul class="service-subtypes-list">
                  <li v-for="subtype in getServiceSubtypes(request)" :key="subtype">
                    {{ subtype }}
                  </li>
                </ul>
              </td>
              <td>{{ getUnitNumber(request) }}</td>
              <td>
                <select
                  class="zp-table-select"
                  :value="shopRatings[request.id]"
                  :required="selectedRequests.includes(request.id)"
                  @change="shopRatings[request.id] = $event.target.value"
                >
                  <option value="" disabled>Rate</option>
                  <option
                    v-for="option in ratingOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  class="zp-table-select"
                  :value="agentRatings[request.id]"
                  :required="selectedRequests.includes(request.id)"
                  @change="agentRatings[request.id] = $event.target.value"
                >
                  <option value="" disabled>Rate</option>
                  <option
                    v-for="option in ratingOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <!-- <pre>{{ JSON.stringify(reqData, null, 2) }}</pre> -->

    <BaseInput id="next-action-date" label="Next Action date" v-model="nextActionDate" type="date" :required="true" />

    <div>
      <BaseButton type="submit" variant="primary" :disabled="isLoading || !selectedRequests.length">
        {{ isLoading ? 'Submitting...' : 'Submit' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseSelect from '../BaseSelect.vue'
import BaseInput from '../BaseInput.vue'
import BaseButton from '../BaseButton.vue'
import TablePagination from '../TablePagination.vue'
import { appState } from '../../store'
import {
  ServiceSatisfactionOptions,
  WillUseAgainOptions,
  ratingOptions,
  RequestLimitOptions
} from '../../config/select-options'
import { createTouchpoint } from '../../utils/touchpoint'
import { updateMaintenanceRequests } from '../../utils/maintenanceRequests'
import { useUserStore } from '../../store/user'
const { user, fetchUser } = useUserStore()
fetchUser()
const isLoading = ref(false)
const isFetchingRequests = ref(false)
const reqPage = ref(0)
const reqLimit = ref(10)
const reqData = ref([])
const hasMoreRecords = ref(false)
const selectedRequests = ref([])
const serviceSatisfaction = ref('')
const willUseAgain = ref('')
// Keyed by request id, not one shared value — a single call can cover
// requests serviced by different shops/agents, so each row rates its own.
// Re-initialized fresh in fetchRequests() whenever reqData changes, same
// reset point as selectedRequests being cleared on page/limit change.
const shopRatings = ref({})
const agentRatings = ref({})
const nextActionDate = ref('')

const TABLE_COLUMNS = [
  'Name',
  'Used Date',
  "Shop Name",
  'Service Type',
  'Service Subtypes',
  'Unit Number',
  'Shop Rating',
  'Agent Rating'
]

const allSelected = computed(
  () =>
    reqData.value.length > 0 &&
    selectedRequests.value.length === reqData.value.length
)

const toggleSelectAll = () => {
  selectedRequests.value = allSelected.value
    ? []
    : reqData.value.map(request => request.id)
}

const canGoNext = computed(() => hasMoreRecords.value)

function handleLimitChange(newLimit) {
  reqLimit.value = newLimit
  reqPage.value = 0
  selectedRequests.value = []
  fetchRequests()
}

function goToPrevPage() {
  if (reqPage.value === 0) return
  reqPage.value -= 1
  selectedRequests.value = []
  fetchRequests()
}

function goToNextPage() {
  if (!canGoNext.value) return
  reqPage.value += 1
  selectedRequests.value = []
  fetchRequests()
}

function getServiceSubtypes(request) {
  const value = request.Service_Types
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(/[,;]\s*/).filter(Boolean)
  return value ? [value] : []
}

function getUnitNumber(request) {
  return [request.Truck_Unit_Number, request.Trailer_Unit_Number]
    .filter(Boolean)
    .join(' / ')
}

async function submitPostServiceFeedback() {
  isLoading.value = true

  const touchpointApiData = {
    Maintenance_Offers: appState.value.entityId,
    Conversation_Type: appState.value.conversationType,
    Call_Outcome: appState.value.callOutcome,
    Next_Action_Date: nextActionDate.value,
    Owner: user.value?.id || ''
  }
  const createResp = await createTouchpoint(touchpointApiData)

  const tp = await ZOHO.CRM.API.getRecord({
    Entity: 'Maintenance_Touchpoints',
    approved: 'both',
    RecordID: createResp.data[0].details.id
  })
  console.log(tp)

  // Service_Satisfaction/Will_Use_Again/Touchpoint are the same for every
  // selected request; Shop_Rating/Maintenance_Agent_Rating are per-row, so
  // each request gets its own updateMaintenanceRequests call rather than
  // one shared call for all of them.
  const updatePromises = selectedRequests.value.flatMap(id =>
    updateMaintenanceRequests([id], {
      Service_Satisfaction: serviceSatisfaction.value,
      Will_Use_Again: willUseAgain.value,
      Shop_Rating: shopRatings.value[id],
      Maintenance_Agent_Rating: agentRatings.value[id],
      Touchpoint: {
        id: createResp.data[0].details.id
      }
    })
  )

  await Promise.all(updatePromises)

  alert('Feedback submitted and touchpoint created successfully.')
  setTimeout(() => {
    isLoading.value = false
    ZOHO.CRM.UI.Popup.closeReload()
  }, 1500)
}

async function fetchRequests() {
  isFetchingRequests.value = true
  hasMoreRecords.value = false

  try {
    const response = await ZOHO.CRM.FUNCTIONS.execute(
      'msGetMaintenanceRequests',
      {
        moId: appState.value.entityId,
        offset: reqPage.value * reqLimit.value,
        limit: reqLimit.value
      }
    )
    const responseData = response?.details?.output
    if (typeof responseData === 'string') {
      const parsedResponse = JSON.parse(responseData)
      reqData.value = parsedResponse.data
      hasMoreRecords.value = Boolean(parsedResponse.info?.more_records)

      // Pre-fill from whatever's already on the request, if anything — not
      // just blank every time. Shop_Rating/Maintenance_Agent_Rating are
      // picklist fields, so Zoho always sends these back as strings ("3"),
      // matching ratingOptions' string values above.
      const freshShopRatings = {}
      const freshAgentRatings = {}
      for (const request of reqData.value) {
        freshShopRatings[request.id] = request.Shop_Rating
          ? String(request.Shop_Rating)
          : ''
        freshAgentRatings[request.id] = request.Maintenance_Agent_Rating
          ? String(request.Maintenance_Agent_Rating)
          : ''
      }
      shopRatings.value = freshShopRatings
      agentRatings.value = freshAgentRatings
    }
  } finally {
    isFetchingRequests.value = false
  }
}

fetchRequests()
</script>

<style scoped>
.request-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 20px;
}

.request-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: var(--color-text);
}

.request-table th,
.request-table td {
  padding: 10px 12px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border-subtle);
}

.request-table thead th {
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: capitalize;
  border-bottom: 1px solid var(--color-border);
}

.request-table tbody tr:last-child td {
  border-bottom: none;
}

.request-table tbody tr:hover {
  background: var(--color-surface-hover);
}

.request-table tbody tr.is-selected {
  background: var(--color-surface-selected);
}

.request-table tbody tr.is-selected:hover {
  background: var(--color-surface-selected-hover);
}

.zp-table-select {
  height: 32px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 13px;
  background-color: var(--color-surface);
  color: var(--color-text);
}

.zp-table-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
  outline: none;
}

.service-subtypes-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.request-table-status {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: middle;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: zp-spin 0.7s linear infinite;
}

@keyframes zp-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
