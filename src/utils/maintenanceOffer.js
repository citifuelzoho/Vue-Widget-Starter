/**
 * Updates the current Maintenance_Sales (Maintenance Offer) record in Zoho CRM.
 * @param {string} recordId - The Maintenance_Sales record id (appState.entityId).
 * @param {Object} fields - Field values to apply.
 * @returns {Promise} Resolves/rejects with the ZOHO.CRM.API.updateRecord result.
 */
export function updateMaintenanceOffer(recordId, fields) {
  return ZOHO.CRM.API.updateRecord({
    Entity: 'Maintenance_Sales',
    // Same reactive-Proxy hazard as createTouchpoint/updateMaintenanceRequests
    // (see touchpoint.js) — Preferred_Language/Preferred_Communication are
    // built from BaseMultiSelect refs, so deep-clone to plain JSON first.
    APIData: JSON.parse(JSON.stringify({ id: recordId, ...fields })),
    Trigger: ['workflow']
  })
}
