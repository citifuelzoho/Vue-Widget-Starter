/**
 * Creates a Maintenance_Touchpoints record in Zoho CRM.
 * @param {Object} apiData - Field values for the touchpoint record.
 * @returns {Promise} Resolves/rejects with the ZOHO.CRM.API.insertRecord result.
 */
export function createTouchpoint(apiData) {
  return ZOHO.CRM.API.insertRecord({
    Entity: 'Maintenance_Touchpoints',
    APIData: apiData,
    Trigger: ['workflow']
  })
}
