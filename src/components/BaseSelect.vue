<template>
  <div class="zp-section">
    <label class="zp-select-label" :for="id">{{ label }}</label>
    <select
      :id="id"
      class="zp-input"
      :value="modelValue"
      :required="required"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
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
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: 'Select an option'
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

  .zp-select-label {
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
