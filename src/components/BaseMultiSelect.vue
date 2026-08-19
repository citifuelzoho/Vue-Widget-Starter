<template>
  <div class="zp-section">
    <label class="zp-select-label" :for="id">{{ label }}</label>

    <div
      :id="id"
      class="zp-chip-list"
      role="listbox"
      aria-multiselectable="true"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="zp-chip"
        :class="{ 'is-selected': isSelected(option.value) }"
        @click="toggleOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
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
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    required: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const isSelected = value => props.modelValue.includes(value)

  const toggleOption = value => {
    const nextValue = isSelected(value)
      ? props.modelValue.filter(item => item !== value)
      : [...props.modelValue, value]

    emit('update:modelValue', nextValue)
  }
</script>

<style scoped>
  .zp-section {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .zp-select-label {
    width: 160px;
    font-size: 14px;
    color: var(--color-text-muted);
    padding-top: 8px;
  }

  .zp-chip-list {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .zp-chip {
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zp-chip:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .zp-chip.is-selected {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #ffffff;
  }
</style>
