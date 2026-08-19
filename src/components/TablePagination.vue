<template>
  <div class="table-pagination">
    <label class="limit-select" for="request-limit">
      <span>Rows per page</span>
      <select
        id="request-limit"
        class="limit-select-input"
        :value="String(limit)"
        @change="$emit('update:limit', Number($event.target.value))"
      >
        <option
          v-for="option in limitOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="pager">
      <button
        type="button"
        class="pager-btn"
        :disabled="page === 0"
        aria-label="Previous page"
        @click="$emit('prev')"
      >
        ‹
      </button>
      <span class="pager-page">Page {{ page + 1 }}</span>
      <button
        type="button"
        class="pager-btn"
        :disabled="disableNext"
        aria-label="Next page"
        @click="$emit('next')"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    limit: {
      type: Number,
      required: true
    },
    limitOptions: {
      type: Array,
      default: () => []
    },
    page: {
      type: Number,
      default: 0
    },
    disableNext: {
      type: Boolean,
      default: false
    }
  })

  defineEmits(['update:limit', 'prev', 'next'])
</script>

<style scoped>
  .table-pagination {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 16px;
    margin-bottom: 12px;
  }

  .pager {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pager-page {
    font-size: 14px;
    color: var(--color-text-muted);
    min-width: 70px;
    text-align: center;
  }

  .limit-select {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .limit-select-input {
    height: 28px;
    padding: 0 8px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .limit-select-input:hover {
    border-color: var(--color-accent);
  }

  .limit-select-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
    outline: none;
  }

  .pager-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pager-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .pager-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
