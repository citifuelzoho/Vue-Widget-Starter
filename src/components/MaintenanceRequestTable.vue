<template>
  <div class="request-table">
    <p v-if="!geographyId" class="request-table__empty">
      Select a Maintenance Geography to see its requests.
    </p>

    <p v-else-if="isLoading" class="request-table__empty">
      Loading requests...
    </p>

    <p v-else-if="errorMessage" class="request-table__empty request-table__empty--error">
      {{ errorMessage }}
    </p>

    <p v-else-if="records.length === 0" class="request-table__empty">
      No requests found for this geography.
    </p>

    <div v-else class="request-table__scroll">
      <table class="request-table__table">
        <thead>
          <tr>
            <th class="request-table__checkbox-cell">
              <input type="checkbox" :checked="allSelected" :disabled="selectableRecords.length === 0"
                aria-label="Select all requests" @change="toggleAll" />
            </th>
            <th>Name</th>
            <th>PO</th>
            <th>Amount</th>
            <th>Rebate Amount</th>
            <th>Applied Rebate</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id" class="request-table__row"
            :class="{
              'request-table__row--selected': isSelected(record.id),
              'request-table__row--locked': isLocked(record)
            }" @click="toggle(record.id)">
            <td class="request-table__checkbox-cell">
              <input type="checkbox" :checked="isSelected(record.id)" :disabled="isLocked(record)"
                :aria-label="`Select ${record.Name}`" @click.stop @change="toggle(record.id)" />
            </td>
            <td>{{ record.Name }}</td>
            <td>{{ record.Single_Line_9 }}</td>
            <td>{{ (Number(record.Discounted_Amount) || 0).toFixed(2) }}</td>
            <td>{{ rebateAmountFor(record) === null ? '—' : rebateAmountFor(record).toFixed(2) }}</td>
            <td>
              <span v-if="appliedRebateStatus(record)" class="request-table__badge"
                :class="`request-table__badge--${appliedRebateStatus(record)}`">
                {{ appliedRebateFor(record).toFixed(2) }}
              </span>
              <span v-else>{{ appliedRebateFor(record).toFixed(2) }}</span>
            </td>
            <td>{{ formatDate(record.Created_Time) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { runCoqlQuery } from '../utils/coql'

const props = defineProps({
  // The selected Maintenance_Geography record id — records are fetched
  // fresh (and selection is untouched, see the watcher below) whenever
  // this changes.
  geographyId: {
    type: [String, Number],
    default: null
  },
  // Selected Maintenance_Request record ids.
  modelValue: {
    type: Array,
    default: () => []
  },
  // The selected geography's INPUT_RABATE_AMOUNT (a percent, e.g. 15 for
  // 15%) — the parent already has this loaded (it's what the geography
  // dropdown's own options carry), so it's passed down rather than this
  // component re-fetching the same geography record itself.
  rebatePercent: {
    type: [String, Number],
    default: null
  },
  // The overall Zelle payment amount (App.vue's "Amount" field) — Applied
  // Rebate distributes this across the selected rows.
  zelleAmount: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:remaining'])

const records = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

// Record ids are always digit strings/numbers — this is what's
// interpolated straight into the COQL query below (as an unquoted id
// literal, matching how Zoho's own docs compare lookup fields), so a
// malformed prop value gets rejected here instead of reaching the query.
function isValidRecordId(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'string' && /^\d+$/.test(value)
}

async function fetchRequests(geographyId) {
  if (!isValidRecordId(geographyId)) {
    records.value = []
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const selectQuery = `select id, Name, Single_Line_9, Shop_Name, Created_Time, Discounted_Amount,Zelle_Transaction from Maintenance_Request where ((Status='In CMP' OR Status='Data Entry Face') AND Shop_Name.Maintenance_Geography = ${geographyId}) ORDER BY Created_Time desc limit 20`
    records.value = await runCoqlQuery(selectQuery)
  } catch (error) {
    console.error('Failed to fetch Maintenance_Request records', error)
    errorMessage.value = 'Failed to load requests. Please try again.'
    records.value = []
  } finally {
    isLoading.value = false
  }
}

// Re-fetches whenever the parent changes which geography is selected.
// Doesn't touch modelValue itself — if the parent wants selection cleared
// on a geography change too, that's a call for it to make, not this
// component (mirrors SearchableDropdown leaving searchQuery untouched
// across open/close).
watch(() => props.geographyId, fetchRequests, { immediate: true })

// A request that already has a Zelle_Transaction can't be picked for
// another one — its checkbox is disabled and clicking the row is a no-op
// (see toggle below), rather than letting it into modelValue at all.
function isLocked(record) {
  return record.Zelle_Transaction !== null && record.Zelle_Transaction !== undefined
}

const selectableRecords = computed(() =>
  records.value.filter(record => !isLocked(record))
)

function isSelected(id) {
  return props.modelValue.includes(id)
}

function toggle(id) {
  const record = records.value.find(existing => existing.id === id)
  if (record && isLocked(record)) return

  const next = isSelected(id)
    ? props.modelValue.filter(existing => existing !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

const allSelected = computed(
  () =>
    selectableRecords.value.length > 0 &&
    selectableRecords.value.every(record => isSelected(record.id))
)

function toggleAll() {
  emit(
    'update:modelValue',
    allSelected.value ? [] : selectableRecords.value.map(record => record.id)
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

// The geography search now returns geographies with no rebate percent set
// at all (previously it only ever returned ones that had one), so this is
// a real, reachable case now — not just rebatePercent === 0. Number(null)
// and Number(0) are both falsy, so they have to be told apart before
// collapsing to a number: a genuine 0% is still a rebate percent (capped
// proportional allocation, cap is just $0 for every row); "not set" means
// there's nothing to be proportional to at all, so Amount is split evenly
// instead, and Expected Rebate is left empty rather than sent as $0.
const hasRebatePercent = computed(() => {
  const value = props.rebatePercent
  return value !== null && value !== undefined && value !== ''
})
const rebatePercentNumber = computed(() => Number(props.rebatePercent) || 0)
const zelleAmountNumber = computed(() => Number(props.zelleAmount) || 0)

// Rebate Amount: rebatePercent% of this one record's own Discounted_Amount
// — independent of everything else in the table. null (not 0) when the
// geography has no rebate percent set — there's nothing to compute.
function rebateAmountFor(record) {
  if (!hasRebatePercent.value) return null
  const discountedAmount = Number(record.Discounted_Amount) || 0
  return (discountedAmount * rebatePercentNumber.value) / 100
}

// Splits `totalCents` across `ids` as evenly as integer cents allow —
// every share is totalCents/ids.length, floored, with the pennies lost to
// flooring handed out one per id (in `ids` order; every raw share is
// identical here, so there's no "closest to rounding up" to rank by like
// the proportional case has).
function splitEvenly(totalCents, ids) {
  const byId = {}
  const baseCents = Math.floor(totalCents / ids.length)
  const shares = ids.map(() => baseCents)

  let leftoverCents = totalCents - baseCents * ids.length
  for (let i = 0; i < leftoverCents; i++) {
    shares[i % shares.length] += 1
  }

  ids.forEach((id, index) => {
    byId[id] = shares[index] / 100
  })

  return byId
}

// Applied Rebate: the Zelle payment's total Amount, split across the
// *selected* rows.
//
// With a rebate percent set: each row can never absorb more than its own
// Rebate Amount (a request isn't eligible for more rebate than that), so
// the pool actually distributed is capped at the selected rows' combined
// Rebate Amount; whatever part of Amount doesn't fit under that cap is
// `remaining` — Amount that isn't matched to any selected request's
// eligibility. Shares within that capped pool are proportional to each
// row's own Rebate Amount, worked out in integer cents with the
// largest-remainder method (floor every share, then hand the pool's
// leftover cents — from flooring — to whichever rows were closest to
// rounding up) so the shares add back up to the distributed pool exactly,
// with no row ever exceeding its own cap: since the pool is <= the sum of
// caps, each proportional share is mathematically <= its own cap even
// before flooring, and flooring only ever shrinks a share, so the +1 cent
// nudges during remainder distribution can't push any row past its cap
// either.
//
// With no rebate percent set: there's no cap to be proportional to, so
// Amount is split evenly across the selected rows instead (splitEvenly
// above) and all of it is always distributed — remaining is always 0.
const allocation = computed(() => {
  const byId = {}
  const selectedRecords = records.value.filter(record => isSelected(record.id))
  const zelleAmountCents = Math.round(zelleAmountNumber.value * 100)

  if (selectedRecords.length === 0 || zelleAmountCents <= 0) {
    return { byId, remaining: zelleAmountCents / 100 }
  }

  if (!hasRebatePercent.value) {
    return {
      byId: splitEvenly(
        zelleAmountCents,
        selectedRecords.map(record => record.id)
      ),
      remaining: 0
    }
  }

  const capCents = selectedRecords.map(record =>
    Math.round(rebateAmountFor(record) * 100)
  )
  const totalCapCents = capCents.reduce((sum, cap) => sum + cap, 0)

  if (totalCapCents <= 0) {
    return { byId, remaining: zelleAmountCents / 100 }
  }

  const distributableCents = Math.min(zelleAmountCents, totalCapCents)
  const remainingCents = zelleAmountCents - distributableCents

  const shares = selectedRecords.map((record, index) => {
    const rawCents = (capCents[index] / totalCapCents) * distributableCents
    const flooredCents = Math.floor(rawCents)
    return { id: record.id, flooredCents, remainder: rawCents - flooredCents }
  })

  const distributedCents = shares.reduce(
    (sum, share) => sum + share.flooredCents,
    0
  )
  const roundingLeftoverCents = distributableCents - distributedCents

  const byRemainderDesc = [...shares].sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < roundingLeftoverCents; i++) {
    byRemainderDesc[i % byRemainderDesc.length].flooredCents += 1
  }

  shares.forEach(share => {
    byId[share.id] = share.flooredCents / 100
  })

  return { byId, remaining: remainingCents / 100 }
})

function appliedRebateFor(record) {
  return allocation.value.byId[record.id] ?? 0
}

// null when there's no "covered/uncovered" concept to show at all: either
// the row isn't selected (its 0.00 isn't "uncovered" — it's just not part
// of this payment), or the geography has no rebate percent set (even-split
// mode has no per-row cap to be full/partial against). Otherwise, for a
// selected row under a rebate percent: 'full' once Applied Rebate has
// reached that row's own Rebate Amount cap, 'partial' otherwise. Compared
// in cents, same as the allocation math itself, to avoid a same-value
// comparison being thrown off by float noise.
function appliedRebateStatus(record) {
  if (!isSelected(record.id) || !hasRebatePercent.value) return null
  const capCents = Math.round(rebateAmountFor(record) * 100)
  if (capCents <= 0) return 'full'
  const appliedCents = Math.round(appliedRebateFor(record) * 100)
  return appliedCents >= capCents ? 'full' : 'partial'
}

// Surfaced to the parent via v-model:remaining — e.g. an "unmatched" badge
// next to the Amount field.
watch(
  () => allocation.value.remaining,
  remaining => emit('update:remaining', remaining),
  { immediate: true }
)

// Pulled by the parent at submit time (template ref + explicit method call,
// same pattern as FileUpload's checkRequired()/processFile()) once it has a
// just-created Maintenance_Zelle record id to attach to each selected
// request, along with the per-request amounts that only this component has
// actually computed. rebateAmount is null when the geography has no rebate
// percent set — the parent should leave Expected_Rebate_Amount out of that
// request's update entirely rather than sending it as 0.
function getSelectedAllocations() {
  return records.value
    .filter(record => isSelected(record.id))
    .map(record => ({
      id: record.id,
      rebateAmount: rebateAmountFor(record),
      appliedRebate: appliedRebateFor(record)
    }))
}

defineExpose({ getSelectedAllocations })
</script>

<style scoped>
.request-table {
  width: 100%;
  font-size: var(--font-size-control);
  color: var(--color-text);
}

.request-table__empty {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.request-table__empty--error {
  color: var(--color-danger);
}

.request-table__scroll {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.request-table__table {
  width: 100%;
  border-collapse: collapse;
}

.request-table__table th,
.request-table__table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle);
}

.request-table__table thead th {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  background: var(--color-surface-hover);
}

.request-table__checkbox-cell {
  width: 2.25rem;
}

.request-table__row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.request-table__row:hover {
  background: var(--color-surface-hover);
}

.request-table__row--selected {
  background: var(--color-accent-soft);
}

.request-table__row--locked {
  cursor: not-allowed;
  opacity: var(--disabled-opacity);
}

.request-table__row--locked:hover {
  background: none;
}

.request-table__row:last-child td {
  border-bottom: none;
}

.request-table__badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.request-table__badge--full {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.request-table__badge--partial {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
</style>
