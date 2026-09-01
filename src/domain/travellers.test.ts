/* ============================================================================
   The rules a form and a URL guard both ask. No React, no DOM, no browser.

     node --test src/domain/*.test.ts
   ========================================================================= */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { contactErrors, contactFields } from './travellers.ts';
import { billingAddressErrors } from './billing.ts';
import { usableCertificates } from './certificates.ts';
import type { Certificate } from '../data/model.ts';

/* A fixed day, so the age rules are the same next year as they are today. */
const TODAY = '2026-09-07';

const codes = (errors: { field: string; code: string }[]) =>
  errors.map((e) => `${e.field}:${e.code}`);

/* --- what each vertical asks for ----------------------------------------- */

test('a flight asks for a date of birth and a stay does not', () => {
  assert.deepEqual(contactFields('hotel'), ['firstName', 'lastName', 'email']);
  assert.deepEqual(contactFields('air'), ['firstName', 'lastName', 'email', 'dateOfBirth']);
});

test('the same contact passes for a stay and fails for a flight', () => {
  const contact = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };
  assert.deepEqual(codes(contactErrors('hotel', contact, TODAY)), []);
  assert.deepEqual(codes(contactErrors('air', contact, TODAY)), ['dateOfBirth:REQUIRED']);
});

/* --- the fields themselves ------------------------------------------------ */

test('an empty contact reports every field it was asked for, once each', () => {
  assert.deepEqual(codes(contactErrors('hotel', {}, TODAY)), [
    'firstName:REQUIRED', 'lastName:REQUIRED', 'email:REQUIRED',
  ]);
});

test('whitespace is not an answer', () => {
  const errors = contactErrors('hotel', { firstName: '   ', lastName: 'Lovelace', email: 'a@b' }, TODAY);
  assert.deepEqual(codes(errors), ['firstName:REQUIRED']);
});

test('a missing email and a malformed one are different complaints', () => {
  const base = { firstName: 'Ada', lastName: 'Lovelace' };
  assert.deepEqual(codes(contactErrors('hotel', base, TODAY)), ['email:REQUIRED']);
  assert.deepEqual(codes(contactErrors('hotel', { ...base, email: 'ada' }, TODAY)), ['email:EMAIL_FORMAT']);
});

/* --- the age rule, which is why this is a rule and not a required flag ---- */

const flyer = (dateOfBirth: string) =>
  contactErrors('air', { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', dateOfBirth }, TODAY);

test('the lead passenger on a flight must be an adult', () => {
  assert.deepEqual(codes(flyer('1990-01-01')), []);
  assert.deepEqual(codes(flyer('2015-01-01')), ['dateOfBirth:ADULT_REQUIRED']);
});

test('turning eighteen counts on the birthday, not the day after', () => {
  assert.deepEqual(codes(flyer('2008-09-07')), [], 'eighteen today');
  assert.deepEqual(codes(flyer('2008-09-08')), ['dateOfBirth:ADULT_REQUIRED'], 'eighteen tomorrow');
});

test('a date in the future is rejected before it is aged', () => {
  assert.deepEqual(codes(flyer('2030-01-01')), ['dateOfBirth:DATE_FUTURE']);
});

test('something that is not a date says so', () => {
  assert.deepEqual(codes(flyer('not-a-date')), ['dateOfBirth:DATE_INVALID']);
});

/* --- billing -------------------------------------------------------------- */

test('a billing address reports each missing field', () => {
  assert.deepEqual(codes(billingAddressErrors()), [
    'line1:REQUIRED', 'city:REQUIRED', 'postcode:REQUIRED',
  ]);
  assert.deepEqual(codes(billingAddressErrors({ line1: '1 High St', city: 'Bath', postcode: 'BA1 1AA' })), []);
});

/* --- certificates --------------------------------------------------------- */

const certificate = (over: Partial<Certificate>): Certificate => ({
  id: 'c', name: 'Resort week', expiresOn: '2027-01-01', status: 'available', ...over,
});

test('only available, unexpired certificates can be spent', () => {
  const all = [
    certificate({ id: 'ok' }),
    certificate({ id: 'reserved', status: 'reserved' }),
    certificate({ id: 'used', status: 'used' }),
    certificate({ id: 'expired', expiresOn: '2025-11-30' }),
  ];
  assert.deepEqual(usableCertificates(all, TODAY).map((c) => c.id), ['ok']);
});

test('a certificate expiring today is still good today', () => {
  assert.equal(usableCertificates([certificate({ expiresOn: TODAY })], TODAY).length, 1);
});
