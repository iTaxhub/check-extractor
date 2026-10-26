/**
 * True when a cheque's extraction holds at least one real field value. Mirrors
 * the backend's _has_values (backend/api_server.py): an extraction whose fields
 * are all empty (every engine failed) is missing, not done.
 */
export function hasExtractedValues(check: { extraction?: Record<string, unknown> | null } | null | undefined): boolean {
  return Object.values(check?.extraction || {}).some((v: any) => {
    const val = v && typeof v === 'object' && !Array.isArray(v) ? v.value : v;
    return val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
  });
}
