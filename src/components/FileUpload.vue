<template>
  <div class="file-upload">
    <label v-if="label" class="file-upload__label">
      {{ label }}
      <span v-if="required" class="file-upload__required" aria-hidden="true">
        *
      </span>
    </label>

    <div class="file-upload__wrapper">
      <input
        ref="fileInputRef"
        type="file"
        class="file-upload__input"
        :accept="ACCEPTED_TYPES.join(',')"
        @change="handleFileChange"
      />

      <button
        type="button"
        class="file-upload__button"
        :disabled="isLoading"
        @click="triggerFile"
      >
        Choose File
      </button>

      <span class="file-upload__filename">{{ filename }}</span>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'

  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const props = defineProps({
    // Expected shape: { attachment_Id, file_Name } — an already-attached
    // file's record, if this field is editing an existing one.
    oldFile: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    // Purely a visual marker (the "*" in the label) — actual enforcement is
    // still up to the caller via checkRequired(), same as before. Lets a
    // field this component is used for show the same required indicator
    // LabeledInput's native-required fields get, when it is one.
    required: {
      type: Boolean,
      default: false
    }
  })

  const selectedFile = ref(null)
  const fileInputRef = ref(null)

  const filename = computed(() => {
    if (selectedFile.value) return selectedFile.value.name
    if (props.oldFile) return props.oldFile.file_Name
    return 'No File'
  })

  function triggerFile() {
    fileInputRef.value?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Only PDF, JPG, PNG allowed')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('Max size is 5MB')
      event.target.value = ''
      return
    }

    selectedFile.value = file
  }

  /**
   * Uploads the newly picked file (if any) via ZOHO.CRM.API.uploadFile and
   * stages a delete for whatever file it's replacing.
   * @returns {Promise<Array|null>} Entries to merge into the parent's
   *   APIData for this attachment field — `{file_id}` for the new file,
   *   plus `{attachment_id, _delete: null}` for the old one if there was
   *   one — or `null` when nothing was picked, so the caller can leave the
   *   field untouched entirely.
   */
  async function processFile() {
    if (!selectedFile.value) return null

    const result = []

    if (props.oldFile) {
      result.push({
        attachment_id: props.oldFile.attachment_Id,
        _delete: null
      })
    }

    const uploadResponse = await ZOHO.CRM.API.uploadFile({
      CONTENT_TYPE: 'multipart',
      PARTS: [
        {
          headers: { 'Content-Disposition': 'file;' },
          content: '__FILE__'
        }
      ],
      FILE: {
        fileParam: 'content',
        file: selectedFile.value
      }
    })

    result.push({ file_id: uploadResponse.data[0].details.id })

    return result
  }

  function checkRequired() {
    if (!selectedFile.value && !props.oldFile) {
      alert('Please attach a file')
      return false
    }
    return true
  }

  // <script setup> is closed by default (unlike a plain setup() object,
  // which auto-exposes everything it returns) — the parent needs a template
  // ref (e.g. `<FileUpload ref="fileUploadRef" .../>`) to call
  // fileUploadRef.value.checkRequired() / .processFile() at submit time, so
  // both have to be explicitly exposed here.
  defineExpose({ processFile, checkRequired })
</script>

<style scoped>
  .file-upload {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    text-align: left;
    font-size: var(--font-size-control);
    color: var(--color-text);
  }

  .file-upload__label {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .file-upload__required {
    color: var(--color-danger);
  }

  .file-upload__wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .file-upload__input {
    display: none;
  }

  .file-upload__button {
    min-height: var(--control-height);
    box-sizing: border-box;
    padding: 0.5rem 0.9rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font: inherit;
    font-weight: 600;
    color: var(--color-text);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .file-upload__button:hover:not(:disabled) {
    border-color: var(--color-border-hover);
    background: var(--color-surface-hover);
  }

  .file-upload__button:focus-visible {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-ring);
  }

  .file-upload__button:disabled {
    cursor: not-allowed;
    opacity: var(--disabled-opacity);
  }

  .file-upload__filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-muted);
  }
</style>
