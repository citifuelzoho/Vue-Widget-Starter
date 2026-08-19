<template>
  <button :class="['zp-btn', variantClass]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
  const props = defineProps({
    type: {
      type: String,
      default: 'button'
    },
    variant: {
      type: String,
      default: 'primary'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const variantClass = {
    primary: 'zp-btn-primary',
    secondary: 'zp-btn-secondary'
  }[props.variant]
</script>

<style scoped>
  .zp-btn {
    min-width: 100px;
    height: 36px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .zp-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .zp-btn-secondary {
    background: var(--color-btn-secondary-bg);
    color: var(--color-btn-secondary-text);
  }

  .zp-btn-secondary:hover:not(:disabled) {
    background: var(--color-btn-secondary-bg-hover);
  }

  .zp-btn-primary {
    background: linear-gradient(
      to bottom,
      var(--color-accent),
      var(--color-accent-dark)
    );
    color: #ffffff;
  }

  .zp-btn-primary:hover:not(:disabled) {
    background: linear-gradient(
      to bottom,
      var(--color-accent-hover),
      var(--color-accent-hover-dark)
    );
  }
</style>
