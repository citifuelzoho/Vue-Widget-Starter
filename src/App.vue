<template>
  <form class="widget-shell" @submit.prevent="submitForm">
    <div class="inputs">
      <LabeledInput v-model="transactionNumber" label="Transaction Number" placeholder="11-character transaction number"
        maxlength="11" minlength="11" hint="Must be exactly 11 characters" required :disabled="isLoading" />

      <div class="amount-field">
        <LabeledInput v-model="amount" type="amount" label="Amount" required :disabled="isLoading" />
        <span v-if="hasUnmatchedAmount" class="amount-field__badge">
          {{ remainingZelleAmount.toFixed(2) }} unmatched
        </span>
      </div>

      <LabeledInput v-model="dateSent" type="date" label="Date Sent" required :disabled="isLoading" />

      <FileUpload ref="proofFileUploadRef" label="Proof" required :is-loading="isLoading" />
    </div>

    <div class="field">
      <SearchableDropdown v-model="selectedGeographyId" :options="geographyOptions" :loading="isLoadingGeography"
        :disabled="isLoading" label="Maintenance Geography" required value-key="id" label-key="label"
        :placeholder="`Select a geography (${geographyOptions.length})`" search-placeholder="Search geographies..."
        clearable @search="onGeographySearch" />
    </div>

    <div class="field">
      <MaintenanceRequestTable ref="requestTableRef" v-model="selectedRequestIds"
        v-model:remaining="remainingZelleAmount" :geography-id="selectedGeographyId"
        :rebate-percent="selectedGeographyRebatePercent" :zelle-amount="amount" />
    </div>

    <div class="footer">
      <button type="button" class="btn btn--secondary" :disabled="isLoading" @click="closePopup">
        Cancel
      </button>
      <button type="submit" class="btn btn--primary" :disabled="isLoading">
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SearchableDropdown from './components/SearchableDropdown.vue'
import LabeledInput from './components/LabeledInput.vue'
import FileUpload from './components/FileUpload.vue'
import MaintenanceRequestTable from './components/MaintenanceRequestTable.vue'
import { searchMaintenanceGeography } from './utils/maintenanceGeography'
import { applyZelleToRequests } from './utils/maintenanceRequests'
import { debounce } from './utils/debounce'

const ENTITY = 'Maintenance_Zelle'
const GEOGRAPHY_SEARCH_DEBOUNCE_MS = 300

const selectedGeographyId = ref(null)
const geographyOptions = ref([])
const isLoadingGeography = ref(false)
const isLoading = ref(false)
const selectedRequestIds = ref([])
const requestTableRef = ref(null)
// Populated via v-model:remaining from MaintenanceRequestTable — the part
// of `amount` that couldn't be matched to any selected request's own
// Rebate Amount eligibility (0 once everything's accounted for). Purely
// informational now (see the removed guard in submitForm) — still shown as
// a badge next to Amount and feeds Left_Amount on the created record.
// Compared in cents in hasUnmatchedAmount rather than with `> 0` directly,
// since remainingZelleAmount is a float built from cents/100 and a naive
// `> 0` would flag values that only look like exactly 0 (e.g.
// floating-point noise from that division) as still unmatched.
const remainingZelleAmount = ref(0)
const hasUnmatchedAmount = computed(
  () => Math.round(remainingZelleAmount.value * 100) > 0
)

// MaintenanceRequestTable deliberately leaves its own modelValue alone
// when geographyId changes (see its own comment) — picked requests belong
// to whichever geography was selected when they were picked, so once that
// changes the old selection is stale and shouldn't silently carry over.
watch(selectedGeographyId, () => {
  selectedRequestIds.value = []
})

// geographyOptions rows already carry INPUT_RABATE_AMOUNT (see
// runGeographySearch's label mapping below) — reused here rather than
// having MaintenanceRequestTable re-fetch the same geography record itself.
const selectedGeographyRebatePercent = computed(
  () =>
    geographyOptions.value.find(
      option => option.id === selectedGeographyId.value
    )?.INPUT_RABATE_AMOUNT ?? null
)

// Field -> real Zoho API field name (Maintenance_Zelle):
//   transactionNumber   -> Name (must be exactly 11 characters)
//   amount              -> Amount
//   dateSent            -> Date_Sent
//   selectedGeographyId -> Shop_Name (lookup — holds the geography id
//     despite the field's own name; not renamed here, just the label given
//     for it)
//   proofFileUploadRef  -> Proof (FileUpload owns staging/uploading this
//     one — checkRequired()/processFile() called at submit time below)
//   Allocated_Amount/Left_Amount are derived at submit time from amount and
//   remainingZelleAmount, not their own input fields.
//
// Field -> real Zoho API field name (Maintenance_Request, updated per
// selected row after the Maintenance_Zelle record is created — see
// utils/maintenanceRequests.js):
//   Zelle_Transaction      -> lookup to the new Maintenance_Zelle record
//   Zelle_Received_Amount  -> that row's Applied Rebate
//   Expected_Rebate_Amount -> that row's Rebate Amount
const transactionNumber = ref('')
const amount = ref('')
const dateSent = ref('')
const proofFileUploadRef = ref(null)

const runGeographySearch = async query => {
  isLoadingGeography.value = true
  try {
    geographyOptions.value = (await searchMaintenanceGeography(query)).map(el => ({
      ...el,
      label: el.INPUT_RABATE_AMOUNT != null ? `${el.Name} (${el.INPUT_RABATE_AMOUNT}%)` : el.Name
    }))
  } catch (error) {
    console.error('Failed to search Maintenance_Geography', error)
    geographyOptions.value = []
  } finally {
    isLoadingGeography.value = false
  }
}

// Fired on every keystroke inside SearchableDropdown's search box
// (SearchableDropdown itself does no debouncing — this is the only
// debounce in the pipeline). The dropdown no longer re-fetches when it's
// opened, so the initial list is seeded once below, on mount, instead.
const onGeographySearch = debounce(
  runGeographySearch,
  GEOGRAPHY_SEARCH_DEBOUNCE_MS
)

onMounted(() => runGeographySearch(''))
onBeforeUnmount(() => onGeographySearch.cancel())

function closePopup() {
  ZOHO.CRM.UI.Popup.close()
}

// Transaction Number/Amount/Date Sent are validated for free: they're
// real <input required minlength maxlength> elements inside this <form>,
// so an invalid one blocks the native `submit` event (and therefore this
// handler) from ever firing — the browser shows its own validation UI.
// SearchableDropdown and FileUpload aren't native form controls, so they
// need an explicit check here instead, same as the file-upload reference
// code's own checkRequired() calls.
async function submitForm() {
  if (isLoading.value) return

  if (!selectedGeographyId.value) {
    alert('Please select a Maintenance Geography')
    return
  }

  if (selectedRequestIds.value.length === 0) {
    alert('Please select at least one request')
    return
  }

  // The amount input's own sanitizer already strips out any '-' as it's
  // typed or pasted, so a negative value shouldn't be reachable in
  // practice — checked again here anyway as an explicit, load-bearing
  // guard rather than relying on that as the only thing preventing it.
  const amountNumber = Number(amount.value) || 0
  if (amountNumber <= 0) {
    alert('Amount must be greater than 0')
    return
  }

  if (!proofFileUploadRef.value.checkRequired()) return

  try {
    isLoading.value = true

    // remainingZelleAmount can't exceed amountNumber (see the allocation
    // math in MaintenanceRequestTable), so this is never negative.
    const allocatedAmount = Number(
      (amountNumber - remainingZelleAmount.value).toFixed(2)
    )
    const leftAmount = Number(remainingZelleAmount.value.toFixed(2))

    const config = {
      Entity: ENTITY,
      APIData: {
        Name: transactionNumber.value,
        Amount: amount.value,
        Date_Sent: dateSent.value,
        Shop_Name: selectedGeographyId.value,
        Allocated_Amount: allocatedAmount,
        Left_Amount: leftAmount
      },
      // No known Maintenance_Zelle automation to confirm against (see
      // memory: zoho-folder-read-only — nothing for this module there
      // either); 'workflow' matches every other insertRecord in this
      // codebase's history and is a no-op if no workflow rule exists.
      Trigger: ['workflow']
    }

    const proofFile = await proofFileUploadRef.value.processFile()
    if (proofFile) config.APIData.Proof = proofFile

    const createResp = await ZOHO.CRM.API.insertRecord(config)
    const zelleRecordId = createResp.data[0].details.id

    // Split from the outer try/catch on purpose: by this point the
    // Maintenance_Zelle record already exists in Zoho. If linking it to the
    // selected requests fails, the generic "Something went wrong... try
    // again" from the outer catch would be actively wrong advice — retrying
    // the whole form would create a second Zelle record for the same
    // transaction instead of fixing the first one.
    try {
      const allocations = requestTableRef.value.getSelectedAllocations()
      await applyZelleToRequests(allocations, zelleRecordId)
    } catch (linkError) {
      console.error(
        `Maintenance_Zelle ${zelleRecordId} was created, but linking it to the selected requests failed:`,
        linkError
      )
      alert(
        `The Zelle record was created, but linking it to the selected requests failed. Update those requests manually — don't submit this form again, it would create a duplicate Zelle record.`
      )
      isLoading.value = false
      return
    }

    // No `finally` resetting isLoading here on purpose: the popup is about
    // to close, and resetting it would briefly re-enable Save during this
    // 1s delay, risking a second, duplicate submission if it's clicked
    // again before closeReload() actually takes effect.
    setTimeout(() => {
      ZOHO.CRM.UI.Popup.closeReload()
    }, 1000)
  } catch (error) {
    console.error('Submit Error:', error)
    alert('Something went wrong. Please try again.')
    isLoading.value = false
  }
}
</script>

<style scoped>
.inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.field {
  margin-top: 1.5rem;
  text-align: left;
}

.amount-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.amount-field__badge {
  align-self: flex-start;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-size: 0.8rem;
  font-weight: 600;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--font-size-control);
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: var(--disabled-opacity);
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-ring);
}

.btn--secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn--secondary:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  background: var(--color-surface-hover);
}

.btn--primary {
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}
</style>
