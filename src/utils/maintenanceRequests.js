/**
 * Bulk-updates Maintenance_Requests records in Zoho CRM.
 * @param {string[]} recordIds - IDs of the Maintenance_Requests records to update.
 * @param {Object} fields - Field values to apply to every record.
 * @returns {Promise} Resolves/rejects with the ZOHO.CRM.API.updateRecord result.
 */
export function updateMaintenanceRequests(recordIds, fields) {
  return recordIds.map(id => {
    return ZOHO.CRM.API.updateRecord({
      Entity: 'Maintenance_Request',
      APIData: {
        id,
        ...fields
      },
      Trigger: ['workflow']
    })
  })
}
