<template>
  <div class="request-table">
    <p v-if="!geographyId" class="request-table__empty">
      Select a Maintenance Geography to see its requests.
    </p>

    <p v-else-if="isLoading" class="request-table__empty">
      Loading requests...
    </p>

    <p
      v-else-if="errorMessage"
      class="request-table__empty request-table__empty--error"
    >
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
              <input
                type="checkbox"
                :checked="allSelected"
                aria-label="Select all requests"
                @change="toggleAll"
              />
            </th>
            <th>Name</th>
            <th>Shop</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in records"
            :key="record.id"
            class="request-table__row"
            :class="{ 'request-table__row--selected': isSelected(record.id) }"
            @click="toggle(record.id)"
          >
            <td class="request-table__checkbox-cell">
              <input
                type="checkbox"
                :checked="isSelected(record.id)"
                :aria-label="`Select ${record.Name}`"
                @click.stop
                @change="toggle(record.id)"
              />
            </td>
            <td>{{ record.Name }}</td>
            <td>{{ record.Shop_Name?.name || '—' }}</td>
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
    }
  })

  const emit = defineEmits(['update:modelValue'])

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
      const selectQuery = `select id, Name, Shop_Name, Created_Time from Maintenance_Request where Shop_Name.Maintenance_Geography = ${geographyId} limit 200`
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

  function isSelected(id) {
    return props.modelValue.includes(id)
  }

  function toggle(id) {
    const next = isSelected(id)
      ? props.modelValue.filter(existing => existing !== id)
      : [...props.modelValue, id]
    emit('update:modelValue', next)
  }

  const allSelected = computed(
    () =>
      records.value.length > 0 &&
      records.value.every(record => isSelected(record.id))
  )

  function toggleAll() {
    emit(
      'update:modelValue',
      allSelected.value ? [] : records.value.map(record => record.id)
    )
  }

  function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
  }
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

  .request-table__row:last-child td {
    border-bottom: none;
  }
</style>
