import { ref } from 'vue'

// Only fields genuinely shared across forms live here: conversationType/
// callOutcome/entityId are needed both for HomeForm's own routing and for
// every sub-form's touchpoint payload, and page drives which form renders.
// Everything else is local state owned by the form that uses it.
export const appState = ref({
  conversationType: '',
  callOutcome: '',
  entityId: '',
  page: 'home'
})
