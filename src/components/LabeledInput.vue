<template>
  <div class="labeled-input">
    <label v-if="label" :for="inputId" class="labeled-input__label">
      {{ label }}
      <span v-if="required" class="labeled-input__required" aria-hidden="true">
        *
      </span>
    </label>

    <div
      class="labeled-input__control"
      :class="{ 'labeled-input__control--disabled': disabled }"
    >
      <span v-if="type === 'amount'" class="labeled-input__prefix">$</span>

      <input
        :id="inputId"
        class="labeled-input__input"
        :class="{ 'labeled-input__input--with-prefix': type === 'amount' }"
        :type="nativeType"
        :inputmode="type === 'amount' ? 'decimal' : undefined"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength ?? undefined"
        :minlength="minlength ?? undefined"
        @input="onInput"
        @blur="emit('blur', $event)"
      />
    </div>

    <p v-if="hint" class="labeled-input__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
  import { computed, useId } from 'vue'

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text',
      validator: value => ['text', 'date', 'amount'].includes(value)
    },
    placeholder: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: null
    },
    maxlength: {
      type: [String, Number],
      default: null
    },
    minlength: {
      type: [String, Number],
      default: null
    }
  })

  const emit = defineEmits(['update:modelValue', 'blur'])

  const generatedId = useId()
  const inputId = computed(() => props.id || generatedId)

  // "amount" renders as a text input (not type="number") so it can be kept
  // free of the native number spinner and locale-dependent formatting quirks
  // while still filtering to a plain, unsigned decimal string.
  const nativeType = computed(() => (props.type === 'date' ? 'date' : 'text'))

  // Strips anything but digits and a single decimal point, capped at 2
  // fractional digits, so typing/pasting e.g. "12a.3.456" settles on
  // "12.34" rather than being rejected outright.
  function sanitizeAmount(raw) {
    const digitsAndDots = raw.replace(/[^\d.]/g, '')
    const firstDot = digitsAndDots.indexOf('.')
    if (firstDot === -1) return digitsAndDots

    const wholePart = digitsAndDots.slice(0, firstDot)
    const fractionalPart = digitsAndDots
      .slice(firstDot + 1)
      .replace(/\./g, '')
      .slice(0, 2)

    return `${wholePart}.${fractionalPart}`
  }

  function onInput(event) {
    let value = event.target.value

    if (props.type === 'amount') {
      value = sanitizeAmount(value)
      // Reflect the sanitized value back into the DOM when it differs from
      // what was typed (e.g. a rejected second '.' or a letter), so the
      // input never visibly holds characters modelValue doesn't have.
      if (value !== event.target.value) event.target.value = value
    }

    emit('update:modelValue', value)
  }
</script>

<style scoped>
  .labeled-input {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    text-align: left;
    font-size: var(--font-size-control);
    color: var(--color-text);
  }

  .labeled-input__label {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .labeled-input__required {
    color: var(--color-danger);
  }

  .labeled-input__control {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: var(--control-height);
    box-sizing: border-box;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .labeled-input__control:hover:not(.labeled-input__control--disabled) {
    border-color: var(--color-border-hover);
  }

  .labeled-input__control:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-ring);
  }

  .labeled-input__control--disabled {
    cursor: not-allowed;
    opacity: var(--disabled-opacity);
  }

  .labeled-input__prefix {
    padding-left: 0.75rem;
    color: var(--color-text-muted);
  }

  .labeled-input__input {
    flex: 1;
    width: 100%;
    padding: 0.55rem 0.75rem;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    box-sizing: border-box;
  }

  .labeled-input__input--with-prefix {
    padding-left: 0.4rem;
  }

  .labeled-input__input:focus {
    outline: none;
  }

  .labeled-input__input:disabled {
    cursor: not-allowed;
  }

  .labeled-input__hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
</style>
