import { ref } from 'vue'

// A one-shot bridge for carrying already-known field values from one form
// into the next when a form routes into another instead of closing the
// widget (e.g. Re-engagement closing out into Churned). Module-level, not a
// composable factory like useUserStore — the source form is unmounted the
// moment it navigates away, so the data has to live outside any single
// component instance.
const handoffData = ref(null)

export function setHandoffData(data) {
  handoffData.value = data
}

// Reads and clears the pending handoff in one step, so stale data can never
// leak into an unrelated later flow.
export function consumeHandoffData() {
  const data = handoffData.value
  handoffData.value = null
  return data
}
