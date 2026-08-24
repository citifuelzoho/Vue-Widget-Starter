/**
 * Bulk-updates Maintenance_Requests records in Zoho CRM.
 * @param {string[]} recordIds - IDs of the Maintenance_Requests records to update.
 * @param {Object} fields - Field values to apply to every record.
 * @returns {Promise} Resolves/rejects with the ZOHO.CRM.API.updateRecord result.
 */
export function updateMaintenanceRequests(recordIds, fields) {
  // Same reactive-Proxy hazard as createTouchpoint (see its comment) — plain
  // values only for every field this app builds today, but cheap insurance
  // against the same postMessage clone failure if a future caller passes a
  // ref() array/object directly.
  const plainFields = JSON.parse(JSON.stringify(fields))
  return recordIds.map(id => {
    return ZOHO.CRM.API.updateRecord({
      Entity: 'Maintenance_Request',
      APIData: {
        id,
        ...plainFields
      },
      Trigger: ['workflow']
    })
  })
}
