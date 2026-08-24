import { ref } from 'vue'
import { appState } from '../store'

// Maintenance_Sales is the real Zoho API name for the "Maintenance Offers"
// module (confirmed against the zoho/ folder's Deluge functions — see
// docs/ZOHO_AUTOMATION_PLAN.md). This widget is always opened from a
// Maintenance_Sales record, so the entity name doesn't need to come from
// the PageLoad event the way it would in a widget reused across modules.
const MAINTENANCE_OFFER_ENTITY = 'Maintenance_Sales'

export function useMaintenanceOfferStore() {
  const maintenanceOffer = ref(null)

  async function fetchMaintenanceOffer() {
    const response = await ZOHO.CRM.API.getRecord({
      Entity: MAINTENANCE_OFFER_ENTITY,
      RecordID: appState.value.entityId
    })
    maintenanceOffer.value = response.data[0]
  }

  return {
    maintenanceOffer,
    fetchMaintenanceOffer
  }
}
