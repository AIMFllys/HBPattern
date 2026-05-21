export const API_VERSION = 'v1'

export function versionHeaders(): Record<string, string> {
  return { 'X-API-Version': API_VERSION }
}
