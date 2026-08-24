/**
 * Creates a Maintenance_Touchpoints record in Zoho CRM.
 * @param {Object} apiData - Field values for the touchpoint record.
 * @returns {Promise} Resolves/rejects with the ZOHO.CRM.API.insertRecord result.
 */
export function createTouchpoint(apiData) {
  return ZOHO.CRM.API.insertRecord({
    Entity: 'Maintenance_Touchpoints',
    // Deep-clone to plain JSON before this crosses into ZOHO.CRM.API. Any
    // field built from a ref([])'s .value directly (every multiselect field,
    // across every form) is still a Vue reactive Proxy, not a plain array —
    // insertRecord hands data to the parent frame via postMessage internally,
    // and a Proxy can't survive that structured-clone step ("[object Object]
    // could not be cloned"). JSON.parse(JSON.stringify(...)) strips all
    // reactivity, leaving only plain arrays/objects/strings.
    APIData: JSON.parse(JSON.stringify(apiData)),
    Trigger: ['workflow']
  })
}
