/**
 * Self-check for the MICR decoder behind /tools/micr-line-decoder.
 *
 *   cd frontend && npx tsx scripts/check-micr.ts
 */
import assert from 'node:assert/strict';
import { abaValid, decodeMicr } from '../lib/marketing/micr';

// 011000015 is the Federal Reserve Bank of Boston; 011000016 fails the checksum.
assert.equal(abaValid('011000015'), true);
assert.equal(abaValid('011000016'), false);

// Personal check: routing, account then serial after the on-us symbol.
const personal = decodeMicr('T011000015T 123456789U 1001');
assert.equal(personal.country, 'US');
assert.equal(personal.routingValid, true);
assert.equal(personal.account, '123456789');
assert.equal(personal.checkNumber, '1001');

// Business check: serial in the auxiliary on-us field, real glyphs, and an encoded amount.
const business = decodeMicr('⑈004512⑈ ⑆011000015⑆ 9876543210⑈ ⑇0000125050⑇');
assert.equal(business.checkNumber, '004512');
assert.equal(business.account, '9876543210');
assert.equal(business.amount, '$1,250.50');

// Canadian cheque: 5-digit transit and 3-digit institution.
const ca = decodeMicr('U00123U T12345D678T 1234567U');
assert.equal(ca.country, 'CA');
assert.equal(ca.transit, '12345');
assert.equal(ca.institution, '678');
assert.equal(ca.account, '1234567');
assert.equal(ca.checkNumber, '00123');

// Garbage in: a warning, not a crash.
assert.ok(decodeMicr('hello').warnings.length > 0);
assert.ok(decodeMicr('T011000016T 1U').warnings.some((w) => w.includes('checksum')));

console.log('ok  MICR decoder: US personal, US business, Canadian and invalid input');
