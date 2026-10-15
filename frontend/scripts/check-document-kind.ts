/**
 * Self-check for the upload batch classifier.
 *
 *   cd frontend && npx tsx scripts/check-document-kind.ts
 *
 * No framework, like every other check here.
 *
 * The cases below are the SHAPES OF THE REAL CLIENT FILES, measured by running
 * the actual detector over them: `9440 June.pdf` is a 30-page statement that
 * yielded 223 cheques with none on its transaction pages, and
 * `Feb Check Images.pdf` is a contact sheet running about twenty per page
 * across every page. If the thresholds drift so that a statement starts
 * sorting as a sheet, extraction gets pointed at the wrong kind of document
 * and this fails.
 */
import assert from 'node:assert/strict';
import { classifyDocument, groupByKind, KIND_ORDER, type DocumentSignals } from '../lib/document-kind';

const kindOf = (s: DocumentSignals) => classifyDocument(s).kind;

/** Build a per-page array: `n` pages of `cheques`, then `blanks` empty pages. */
const pages = (n: number, cheques: number, blanks = 0): number[] =>
  [...Array(n).fill(cheques), ...Array(blanks).fill(0)];

/* --- 1. The real bank statement -------------------------------------- */
// 30 pages, 223 cheques, concentrated on the cheque-image pages. The rest are
// transaction listings the detector correctly found nothing on.
{
  const s: DocumentSignals = {
    totalPages: 30,
    totalCheques: 223,
    chequesPerPage: pages(11, 20, 19), // 11 pages of cheques, 19 transaction pages
  };
  const v = classifyDocument(s);
  assert.equal(v.kind, 'bank-statement', `a 30-page statement sorted as ${v.kind}`);
  assert.equal(v.confidence, 'high');
  assert.match(v.reason, /transactions/, 'the reason should say why it is not a sheet');
}

/* --- 2. The real contact sheet ---------------------------------------- */
// Every page is cheques, stacked several to a page.
{
  const s: DocumentSignals = { totalPages: 5, totalCheques: 100, chequesPerPage: pages(5, 20) };
  const v = classifyDocument(s);
  assert.equal(v.kind, 'cheque-sheet', `a contact sheet sorted as ${v.kind}`);
  assert.equal(v.confidence, 'high', 'full coverage should be high confidence');
}

/* --- 3. Nothing found is its own outcome, not an empty sheet ---------- */
// This is the whole point of the feature: two bad files among thirty must not
// look like the other twenty-eight.
{
  assert.equal(kindOf({ totalPages: 12, totalCheques: 0, chequesPerPage: pages(0, 0, 12) }), 'no-cheques');
  assert.equal(kindOf({ totalPages: 0, totalCheques: 0, chequesPerPage: [] }), 'no-cheques');
  // A file with pages but nothing on them still reports the page count, so the
  // user can tell "scanned badly" from "empty file".
  assert.match(
    classifyDocument({ totalPages: 12, totalCheques: 0, chequesPerPage: pages(0, 0, 12) }).reason,
    /12 pages/
  );
}

/* --- 4. A single cheque ------------------------------------------------ */
{
  assert.equal(kindOf({ totalPages: 1, totalCheques: 1, chequesPerPage: [1] }), 'single-cheque');
  assert.equal(kindOf({ totalPages: 1, totalCheques: 2, chequesPerPage: [2] }), 'single-cheque');
  // One page packed with cheques is a sheet, not a single cheque.
  assert.equal(kindOf({ totalPages: 1, totalCheques: 18, chequesPerPage: [18] }), 'cheque-sheet');
}

/* --- 5. The boundary that actually matters ---------------------------- */
// A long document whose cheques cover MOST pages is a sheet; the same length
// with cheques on a minority is a statement. Getting this backwards is the
// failure that points extraction at the wrong thing.
{
  assert.equal(
    kindOf({ totalPages: 10, totalCheques: 60, chequesPerPage: pages(9, 6, 1) }),  // 90% coverage
    'cheque-sheet'
  );
  assert.equal(
    kindOf({ totalPages: 10, totalCheques: 12, chequesPerPage: pages(3, 4, 7) }),  // 30% coverage
    'bank-statement'
  );
}

/* --- 6. Missing per-page data degrades, it does not crash -------------- */
// Older results carry totals but no per-page array.
{
  const v = classifyDocument({ totalPages: 8, totalCheques: 40, chequesPerPage: [] });
  assert.ok(v.kind, 'a result with no per-page counts must still classify');
  assert.doesNotThrow(() => classifyDocument({ totalPages: 0, totalCheques: 5, chequesPerPage: [] }));
  // Negative or nonsense input must not produce NaN reasons.
  const bad = classifyDocument({ totalPages: -3, totalCheques: -1, chequesPerPage: [] });
  assert.equal(bad.kind, 'no-cheques');
  assert.doesNotMatch(bad.reason, /NaN|Infinity|undefined/);
}

/* --- 7. Grouping puts the files needing a human first ----------------- */
{
  type F = { name: string; sig: DocumentSignals | null };
  const batch: F[] = [
    { name: 'sheet-a.pdf',  sig: { totalPages: 5,  totalCheques: 100, chequesPerPage: pages(5, 20) } },
    { name: 'statement.pdf',sig: { totalPages: 30, totalCheques: 223, chequesPerPage: pages(11, 20, 19) } },
    { name: 'blank.pdf',    sig: { totalPages: 4,  totalCheques: 0,   chequesPerPage: pages(0, 0, 4) } },
    { name: 'one.pdf',      sig: { totalPages: 1,  totalCheques: 1,   chequesPerPage: [1] } },
    { name: 'pending.pdf',  sig: null },   // still analysing
  ];

  const groups = groupByKind(batch, (f) => f.sig);
  assert.equal(groups[0].kind, 'no-cheques', 'the files needing attention must come first');
  assert.deepEqual(groups.map((g) => g.kind),
    KIND_ORDER.filter((k) => groups.some((g) => g.kind === k)),
    'groups must follow KIND_ORDER');

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  assert.equal(total, 4, 'the un-analysed file must not be grouped, and nothing else dropped');
  assert.ok(groups.every((g) => g.items.every((i) => i.verdict.reason.length > 0)),
    'every file needs a reason the user can read');
}

console.log('  ok  the real statement sorts as a statement, the real sheet as a sheet');
console.log('  ok  "no cheques found" is its own group, and it comes first');
console.log('  ok  the coverage boundary holds in both directions');
console.log('  ok  missing or nonsense signals degrade without crashing');
console.log('\nall document-kind checks passed');
