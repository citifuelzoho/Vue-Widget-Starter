const CONNECTION_NAME = 'crmfile'
const COQL_URL = 'https://www.zohoapis.com/crm/v8/coql'

/**
 * Runs a COQL select_query through the "crmfile" CRM connection
 * (ZOHO.CRM.CONNECTION.invoke) and returns the resulting records.
 *
 * Goes through the connection rather than ZOHO.CRM.API.coql, hitting the
 * COQL REST endpoint directly — the connection carries whatever auth/scope
 * it's configured with in Zoho. Shared by every COQL-backed fetch in this
 * app so the two bugs already found in this call don't need re-fixing
 * per caller:
 *   - param_type 1 sends `parameters` as query-string params, which COQL
 *     rejects ("expected_data_type: jsonobject"); param_type 2 sends them
 *     as the actual JSON request body instead.
 *   - invoke()'s response isn't wrapped under the connection name — it's
 *     { status: 'success'|'failure', code, message,
 *       details: { status: 'true'|'false', statusMessage: <raw COQL body> } }
 *     — `status`/`code` only confirm the connection itself was invoked;
 *     `details.status` is what tells you whether the downstream COQL call
 *     actually succeeded, and both have to check out before trusting
 *     details.statusMessage.data.
 * @param {string} selectQuery - A full COQL `select ...` statement.
 * @returns {Promise<Array<Object>>} The query's result rows (`[]` if none).
 */
export async function runCoqlQuery(selectQuery) {
  const response = await ZOHO.CRM.CONNECTION.invoke(CONNECTION_NAME, {
    url: COQL_URL,
    method: 'POST',
    param_type: 2,
    headers: {
      'Content-Type': 'application/json'
    },
    parameters: {
      select_query: selectQuery
    }
  })

  const details = response?.details
  const requestSucceeded =
    response?.status === 'success' && String(details?.status) === 'true'

  if (!requestSucceeded) {
    throw new Error(
      details?.statusMessage?.message ||
        response?.message ||
        'COQL query failed'
    )
  }

  return details.statusMessage?.data || []
}
