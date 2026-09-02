/**
 * Attaches a just-created Maintenance_Zelle record to each given
 * Maintenance_Request, recording how much of that Zelle payment was
 * received/expected for that specific request.
 * @param {Array<{id: string, appliedRebate: number, rebateAmount: number|null}>} allocations
 *   - one entry per selected request (see MaintenanceRequestTable's
 *   getSelectedAllocations()). rebateAmount is null when the geography had
 *   no rebate percent set — Expected_Rebate_Amount is left out of that
 *   request's update entirely in that case, rather than sent as 0.
 * @param {string} zelleRecordId - id of the Maintenance_Zelle record these
 *   requests are being linked to.
 * @returns {Promise<Array>} Resolves once every update has gone through —
 *   one ZOHO.CRM.API.updateRecord call per allocation, run in parallel (not
 *   a single bulk call), same pattern as this app's other multi-record
 *   update needs.
 */
export function applyZelleToRequests(allocations, zelleRecordId) {
  return Promise.all(
    allocations.map(allocation => {
      const APIData = {
        id: allocation.id,
        Zelle_Transaction: { id: zelleRecordId },
        Zelle_Received_Amount: Number(allocation.appliedRebate.toFixed(2))
      }

      if (allocation.rebateAmount !== null) {
        APIData.Expected_Rebate_Amount = Number(
          allocation.rebateAmount.toFixed(2)
        )
      }

      return ZOHO.CRM.API.updateRecord({
        Entity: 'Maintenance_Request',
        APIData,
        Trigger: ['workflow']
      })
    })
  )
}
