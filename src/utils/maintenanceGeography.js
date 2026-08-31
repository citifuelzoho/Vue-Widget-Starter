import { runCoqlQuery } from './coql'

/**
 * Searches Maintenance_Geography records in Zoho CRM via COQL, matching
 * `Name` against the given search text. Always restricted to records with a
 * rebate amount set — Maintenance_Geography rows without one aren't valid
 * selections here.
 * @param {string} searchText - Text to filter Name by (COQL `like`,
 *   case-sensitive). Empty/blank returns an unfiltered page — used to seed
 *   the dropdown the first time it's opened. Single quotes are escaped so
 *   arbitrary typed text can't break out of the query string.
 * @param {number} [limit=25] - Max records to return (COQL max is 200).
 * @returns {Promise<Array<{id: string, Name: string}>>}
 */
export async function searchMaintenanceGeography(searchText, limit = 25) {
  const escaped = (searchText || '').trim().replace(/'/g, "''")

  const conditions = ['Name is not null'] //['INPUT_RABATE_AMOUNT is not null']
  if (escaped) conditions.push(`Name like '%${escaped}%'`)

  const selectQuery = `select id, Name from Maintenance_Geography where ${conditions.join(' and ')} order by Name limit ${limit}`

  return runCoqlQuery(selectQuery)
}
