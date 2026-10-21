/**
 * Every call to Intuit (the QuickBooks API and the OAuth endpoints) goes through
 * qbFetch, so the `intuit_tid` response header is always recorded.
 *
 * Intuit support finds a failed request by that id; without it "the call failed
 * on Tuesday" cannot be traced. The Intuit app assessment asks whether the app
 * captures it. Behaviour is otherwise unchanged: same arguments, same Response,
 * a thrown network error still throws.
 *
 * One log line per call: method, path with the company id masked and the query
 * string dropped (it can carry transaction details), status, intuit_tid. Failures
 * log as errors so they stand out in the Vercel log.
 */

/** The value of Intuit's `intuit_tid` response header, or null if absent. */
export function intuitTid(res: { headers?: { get?(name: string): string | null } } | null | undefined): string | null {
  return res?.headers?.get?.('intuit_tid') ?? null;
}

/** `/v3/company/123456/query?query=...` -> `/v3/company/:realm/query` */
export function describeCall(input: unknown): string {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : String((input as { url?: string })?.url ?? input);
  try {
    const u = new URL(raw);
    return u.pathname.replace(/\/company\/\d+/g, '/company/:realm');
  } catch {
    return 'unparseable-url';
  }
}

export async function qbFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  // Logging must never change what the caller sees: a malformed response (or a
  // test double with no headers) is logged as best it can be, never thrown.
  try {
    const line = `[qbo] ${(init?.method || 'GET').toUpperCase()} ${describeCall(input)} ${res.status} intuit_tid=${intuitTid(res) ?? 'none'}`;
    if (res.ok) console.log(line);
    else console.error(line);
  } catch {
    /* ignore */
  }
  return res;
}
