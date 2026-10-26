/**
 * Regression check for the QB Comparisons crash "e.replace is not a function":
 * stored values can be numbers, and the shared helpers must accept them.
 *
 *   cd frontend && npx tsx scripts/check-comparison-utils.ts
 */
import assert from 'node:assert/strict';
import { extVal, normalizeString, parseAmount } from '../app/(app)/qb-comparisons/utils/comparisonUtils';

assert.equal(extVal({ amount: { value: 1250.5 } }, 'amount'), '1250.5');
assert.equal(extVal({ amount: { value: null } }, 'amount'), '');
assert.equal(extVal({ checkNumber: 1001 }, 'checkNumber'), '1001');
assert.equal(parseAmount(1250.5), 1250.5);
assert.equal(parseAmount('$1,250.50'), 1250.5);
assert.equal(parseAmount(null), 0);
assert.equal(normalizeString(42), '42');
assert.equal(normalizeString(undefined), '');
console.log('ok  comparison helpers accept numbers and nulls');
