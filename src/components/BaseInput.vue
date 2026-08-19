<template>
  <div class="zp-section">
    <label class="zp-field-label" :for="id">{{ label }}</label>
    <input
      :id="id"
      class="zp-input"
      :type="type"
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
    type: {
      type: String,
      default: 'text'
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
    align-items: center;
    margin-bottom: 20px;
  }

  .zp-field-label {
    width: 160px;
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .zp-input {
    flex: 1;
    height: 38px;
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    font-size: 14px;
    transition: all 0.2s ease;
    background-color: var(--color-surface);
    color: var(--color-text);
  }

  .zp-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
    outline: none;
  }
</style>
