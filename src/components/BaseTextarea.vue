<template>
  <div class="zp-section">
    <label class="zp-field-label" :for="id">{{ label }}</label>
    <textarea
      :id="id"
      class="zp-textarea"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
  const props = defineProps({
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 4
    },
    placeholder: {
      type: String,
      default: 'Enter value'
    },
    required: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
  .zp-section {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .zp-field-label {
    width: 160px;
    font-size: 14px;
    color: var(--color-text-muted);
    padding-top: 8px;
  }

  .zp-textarea {
    flex: 1;
    min-height: 100px;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    font-size: 14px;
    resize: vertical;
    transition: all 0.2s ease;
    background-color: var(--color-surface);
    color: var(--color-text);
  }

  .zp-textarea:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
    outline: none;
  }
</style>
