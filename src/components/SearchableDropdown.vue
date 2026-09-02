<template>
  <div ref="rootRef" class="dropdown" :class="{ 'dropdown--open': isOpen }">
    <label v-if="label" class="dropdown__label">
      {{ label }}
      <span v-if="required" class="dropdown__required" aria-hidden="true">
        *
      </span>
    </label>

    <button
      type="button"
      class="dropdown__control"
      :class="{ 'dropdown__control--disabled': disabled }"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span
        class="dropdown__value"
        :class="{ 'dropdown__value--placeholder': !selectedOption }"
      >
        {{ selectedOption ? getLabel(selectedOption) : placeholder }}
      </span>
      <button
        v-if="clearable && selectedOption && !disabled"
        type="button"
        class="dropdown__clear"
        aria-label="Clear selection"
        @click.stop="clearSelection"
      >
        &times;
      </button>

      <span class="dropdown__arrow" aria-hidden="true">&#9662;</span>
    </button>

    <div v-if="isOpen" class="dropdown__panel">
      <div class="dropdown__search">
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="dropdown__search-input"
          :placeholder="searchPlaceholder"
          :disabled="loading"
          @input="handleSearchInput"
          @keydown="handleKeydown"
        />
      </div>

      <ul class="dropdown__options" role="listbox">
        <li v-if="loading" class="dropdown__option dropdown__option--empty">
          {{ loadingText }}
        </li>

        <template v-else>
          <li
            v-if="options.length === 0"
            class="dropdown__option dropdown__option--empty"
          >
            {{ noResultsText }}
          </li>

          <li
            v-for="(option, index) in options"
            :key="getValue(option)"
            class="dropdown__option"
            :class="{
              'dropdown__option--highlighted': index === highlightedIndex,
              'dropdown__option--selected': isSelected(option)
            }"
            role="option"
            :aria-selected="isSelected(option)"
            @mouseenter="highlightedIndex = index"
            @click="selectOption(option)"
          >
            {{ getLabel(option) }}
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

  const props = defineProps({
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Number, Object],
      default: null
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    labelKey: {
      type: String,
      default: 'label'
    },
    placeholder: {
      type: String,
      default: 'Select...'
    },
    searchPlaceholder: {
      type: String,
      default: 'Search...'
    },
    noResultsText: {
      type: String,
      default: 'No results found'
    },
    loadingText: {
      type: String,
      default: 'Loading...'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue', 'change', 'search', 'open'])

  const rootRef = ref(null)
  const searchInputRef = ref(null)
  const isOpen = ref(false)
  const searchQuery = ref('')
  const highlightedIndex = ref(-1)

  // The parent may return a filtered/paged options list on each search, so
  // the currently selected option can fall out of `options`. Cache the last
  // option object we actually saw for the current modelValue so the control
  // keeps showing its label even after it's no longer in the list.
  const cachedSelectedOption = ref(null)

  const getValue = option => option?.[props.valueKey]
  const getLabel = option => option?.[props.labelKey]

  watch(
    () => [props.options, props.modelValue],
    () => {
      const match = props.options.find(
        option => getValue(option) === props.modelValue
      )
      if (match) cachedSelectedOption.value = match
    },
    { immediate: true }
  )

  const selectedOption = computed(() => {
    if (props.modelValue === null || props.modelValue === undefined) {
      return null
    }

    const match = props.options.find(
      option => getValue(option) === props.modelValue
    )
    if (match) return match

    if (
      cachedSelectedOption.value &&
      getValue(cachedSelectedOption.value) === props.modelValue
    ) {
      return cachedSelectedOption.value
    }

    return null
  })

  const isSelected = option =>
    selectedOption.value && getValue(option) === getValue(selectedOption.value)

  // Search text is relayed as-is on every keystroke — debouncing the actual
  // API call is the parent's job (it owns `loading`/`options` too), so it
  // can decide its own timing instead of stacking a second debounce here.
  //
  // This is a real @input handler rather than a watch(searchQuery, ...) on
  // purpose: searchQuery is left untouched across open/close (see
  // openDropdown/closeDropdown — neither resets it), but should this
  // component ever need to change it programmatically in the future, an
  // @input handler still only fires for actual typing, so a search never
  // gets emitted from a non-user change. The parent owns the initial fetch
  // instead (e.g. on mount).
  const emitSearch = query => emit('search', query)

  const handleSearchInput = event => {
    highlightedIndex.value = -1
    // Read straight off the native event rather than searchQuery.value: this
    // listener and v-model's own internal listener are both bound to the
    // same 'input' event, and Vue doesn't guarantee v-model's ref update
    // runs before this one — reading searchQuery.value here could observe
    // the previous keystroke's value instead of the current one (e.g.
    // deleting the last character would emit the prior, not-yet-empty
    // text). event.target.value is always the live DOM value.
    emitSearch(event.target.value.trim())
  }

  const focusSearchInput = () => nextTick(() => searchInputRef.value?.focus())

  // The search input is disabled while `loading` is true (see template), so
  // a focus attempt made the moment a search kicks off (e.g. right on open)
  // can land on a disabled element and silently no-op. Re-attempt once
  // loading clears, so the input still ends up focused after that first
  // fetch resolves.
  watch(
    () => props.loading,
    (isLoading, wasLoading) => {
      if (wasLoading && !isLoading && isOpen.value) focusSearchInput()
    }
  )

  const openDropdown = () => {
    if (props.disabled || isOpen.value) return
    isOpen.value = true
    highlightedIndex.value = props.options.findIndex(isSelected)
    emit('open')
    focusSearchInput()
  }

  const closeDropdown = () => {
    isOpen.value = false
    highlightedIndex.value = -1
  }

  const toggleOpen = () => {
    if (isOpen.value) closeDropdown()
    else openDropdown()
  }

  const selectOption = option => {
    const value = getValue(option)
    cachedSelectedOption.value = option
    emit('update:modelValue', value)
    emit('change', option)
    closeDropdown()
  }

  const clearSelection = () => {
    cachedSelectedOption.value = null
    emit('update:modelValue', null)
    emit('change', null)
  }

  const handleKeydown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (props.options.length === 0) return
      highlightedIndex.value = (highlightedIndex.value + 1) % props.options.length
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (props.options.length === 0) return
      highlightedIndex.value =
        (highlightedIndex.value - 1 + props.options.length) %
        props.options.length
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = props.options[highlightedIndex.value]
      if (option) selectOption(option)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
    }
  }

  const handleClickOutside = event => {
    if (rootRef.value && !rootRef.value.contains(event.target)) {
      closeDropdown()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })
</script>

<style scoped>
  .dropdown {
    position: relative;
    width: 100%;
    font-size: var(--font-size-control);
    color: var(--color-text);
  }

  .dropdown__label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .dropdown__required {
    color: var(--color-danger);
  }

  .dropdown__control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: var(--control-height);
    box-sizing: border-box;
    padding: 0.55rem 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .dropdown__control:hover:not(.dropdown__control--disabled) {
    border-color: var(--color-border-hover);
  }

  .dropdown--open .dropdown__control,
  .dropdown__control:focus-visible {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-ring);
    outline: none;
  }

  .dropdown__control--disabled {
    cursor: not-allowed;
    opacity: var(--disabled-opacity);
  }

  .dropdown__value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown__value--placeholder {
    color: var(--color-text-disabled);
  }

  .dropdown__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-disabled);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }

  .dropdown__clear:hover {
    background: var(--color-surface-disabled);
    color: var(--color-text-muted);
  }

  .dropdown__arrow {
    color: var(--color-text-disabled);
    font-size: 0.7rem;
    transition: transform 0.15s ease;
  }

  .dropdown--open .dropdown__arrow {
    transform: rotate(180deg);
  }

  .dropdown__panel {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-panel);
    overflow: hidden;
  }

  .dropdown__search {
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .dropdown__search-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font: inherit;
    box-sizing: border-box;
  }

  .dropdown__search-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .dropdown__search-input:disabled {
    cursor: not-allowed;
    opacity: var(--disabled-opacity);
  }

  .dropdown__options {
    margin: 0;
    padding: 0.25rem;
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
  }

  .dropdown__option {
    padding: 0.5rem 0.6rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown__option--highlighted {
    background: var(--color-accent-soft);
  }

  .dropdown__option--selected {
    font-weight: 600;
    color: var(--color-accent-hover);
  }

  .dropdown__option--empty {
    color: var(--color-text-disabled);
    cursor: default;
  }

  .dropdown__option--empty:hover {
    background: none;
  }
</style>
