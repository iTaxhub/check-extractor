/**
 * The Python port of classifyDocument must agree with the TS original.
 *
 *   cd frontend && npx tsx scripts/check-doc-kind-parity.ts
 *
 * backend/doc_kind.py is what upload-analyze persists into check_jobs.doc_kind;
 * frontend/lib/document-kind.ts is what the upload page shows. If one drifts,
 * a file is labelled one thing on upload and another in History. This runs the
 * Python module on its four sample shapes (the real client files from
 * check-document-kind.ts) and asserts the TS function returns the same kind.
 * No framework, like every other check here.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyDocument, type DocumentKind } from '../lib/document-kind';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(root, 'backend', 'doc_kind.py');

const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const run = spawnSync(python, ['-I', script, '--samples'], { encoding: 'utf8' });
assert.equal(run.status, 0, `python failed: ${run.stderr || run.error?.message}`);

type Sample = { total_pages: number; total_checks: number; checks_per_page: number[]; kind: DocumentKind };
const samples: Sample[] = JSON.parse(run.stdout);
assert.equal(samples.length, 4, 'expected the four sample signal sets');

for (const s of samples) {
  const ts = classifyDocument({
    totalPages: s.total_pages,
    totalCheques: s.total_checks,
    chequesPerPage: s.checks_per_page,
  }).kind;
  assert.equal(
    ts,
    s.kind,
    `pages=${s.total_pages} cheques=${s.total_checks}: TS says ${ts}, Python says ${s.kind}`
  );
}

// All four kinds must be exercised, or a drift in one could pass vacuously.
assert.deepEqual(
  new Set(samples.map((s) => s.kind)),
  new Set<DocumentKind>(['bank-statement', 'cheque-sheet', 'single-cheque', 'no-cheques'])
);

console.log('check-doc-kind-parity: TS and Python agree on all 4 samples');
