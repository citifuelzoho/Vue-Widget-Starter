<template>
  <form class="widget-shell" @submit.prevent="submitForm">
    <div class="inputs">
      <LabeledInput
        v-model="transactionNumber"
        label="Transaction Number"
        placeholder="11-character transaction number"
        maxlength="11"
        minlength="11"
        hint="Must be exactly 11 characters"
        required
        :disabled="isLoading"
      />

      <LabeledInput
        v-model="amount"
        type="amount"
        label="Amount"
        required
        :disabled="isLoading"
      />

      <LabeledInput
        v-model="dateSent"
        type="date"
        label="Date Sent"
        required
        :disabled="isLoading"
      />

      <FileUpload
        ref="proofFileUploadRef"
        label="Proof"
        required
        :is-loading="isLoading"
      />
    </div>

    <div class="field">
      <SearchableDropdown
        v-model="selectedGeographyId"
        :options="geographyOptions"
        :loading="isLoadingGeography"
        :disabled="isLoading"
        label="Maintenance Geography"
        required
        value-key="id"
        label-key="Name"
        placeholder="Select a geography"
        search-placeholder="Search geographies..."
        clearable
        @search="onGeographySearch"
      />
    </div>

    <div class="field">
      <MaintenanceRequestTable
        v-model="selectedRequestIds"
        :geography-id="selectedGeographyId"
      />
    </div>

    <div class="footer">
      <button
        type="button"
        class="btn btn--secondary"
        :disabled="isLoading"
        @click="closePopup"
      >
        Cancel
      </button>
      <button type="submit" class="btn btn--primary" :disabled="isLoading">
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import SearchableDropdown from './components/SearchableDropdown.vue'
  import LabeledInput from './components/LabeledInput.vue'
  import FileUpload from './components/FileUpload.vue'
  import MaintenanceRequestTable from './components/MaintenanceRequestTable.vue'
  import { searchMaintenanceGeography } from './utils/maintenanceGeography'
  import { debounce } from './utils/debounce'

  const ENTITY = 'Maintenance_Zelle'
  const GEOGRAPHY_SEARCH_DEBOUNCE_MS = 300

  const selectedGeographyId = ref(null)
  const geographyOptions = ref([])
  const isLoadingGeography = ref(false)
  const isLoading = ref(false)
  const selectedRequestIds = ref([])

  // MaintenanceRequestTable deliberately leaves its own modelValue alone
  // when geographyId changes (see its own comment) — picked requests belong
  // to whichever geography was selected when they were picked, so once that
  // changes the old selection is stale and shouldn't silently carry over.
  watch(selectedGeographyId, () => {
    selectedRequestIds.value = []
  })

  // Field -> real Zoho API field name:
  //   transactionNumber  -> Name (must be exactly 11 characters)
  //   amount             -> Amount
  //   dateSent           -> Date_Sent
  //   selectedGeographyId -> Maintenance_Geography (lookup)
  //   proofFileUploadRef -> Proof (FileUpload owns staging/uploading this
  //     one — checkRequired()/processFile() called at submit time below)
  const transactionNumber = ref('')
  const amount = ref('')
  const dateSent = ref('')
  const proofFileUploadRef = ref(null)

  const runGeographySearch = async query => {
    isLoadingGeography.value = true
    try {
      geographyOptions.value = await searchMaintenanceGeography(query)
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

    if (!proofFileUploadRef.value.checkRequired()) return

    try {
      isLoading.value = true

      const config = {
        Entity: ENTITY,
        APIData: {
          Name: transactionNumber.value,
          Amount: amount.value,
          Date_Sent: dateSent.value,
          Maintenance_Geography: selectedGeographyId.value
        },
        // No known Maintenance_Zelle automation to confirm against (see
        // memory: zoho-folder-read-only — nothing for this module there
        // either); 'workflow' matches every other insertRecord in this
        // codebase's history and is a no-op if no workflow rule exists.
        Trigger: ['workflow']
      }

      const proofFile = await proofFileUploadRef.value.processFile()
      if (proofFile) config.APIData.Proof = proofFile

      await ZOHO.CRM.API.insertRecord(config)

      setTimeout(() => {
        ZOHO.CRM.UI.Popup.closeReload()
      }, 1000)
    } catch (error) {
      console.error('Submit Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
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
