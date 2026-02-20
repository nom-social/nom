/**
 * Escapes a string for use in PostgreSQL ILIKE patterns.
 * Prevents %, _, and \ from being interpreted as wildcards.
 */
export function escapeForIlike(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
