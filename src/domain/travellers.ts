/* ============================================================================
   TRAVELLERS  ·  what each vertical needs to know about the person booking
   Two questions, both answered here: which details a vertical asks for, and
   what is wrong with the ones given so far.

   This is the rule the checkout used to hold twice — once as a boolean in the
   step, deciding whether Continue was pressable, and once in the flow,
   deciding whether a URL could skip the step. Two spellings of one rule, over
   two different sources, already drifting apart. One function, asked twice, is
   the whole of the fix.

   Note what it is NOT: a validation library. It returns the same `Validation`
   the sign-in form already uses, so the messages come from the one table in
   src/errors/messages.ts and the fields light up the way they always did.
   ========================================================================= */

import type { Contact, Vertical } from '../data/model';
// Explicit extension: this file is also run directly by `node --test`, and
// Node's resolver does not guess them.
import { validation, type Validation } from '../errors/failure.ts';

export type ContactField = keyof Contact;

/**
 * Which details this vertical asks the lead traveller for, in the order a
 * form should show them.
 *
 * A list rather than a set of booleans, so a step renders what it is given
 * instead of branching on the vertical, and so adding cruises adds a line
 * here rather than an `if` in every form that collects a name.
 */
export const contactFields = (vertical: Vertical): ContactField[] =>
  vertical === 'air'
    /* Airlines will not take a booking without a date of birth for the lead
       passenger, and will not take one from a minor at all. A stay asks for
       neither, which is why this cannot be one shared "required" list. */
    ? ['firstName', 'lastName', 'email', 'dateOfBirth']
    : ['firstName', 'lastName', 'email'];

/** The youngest a lead traveller may be on the day they book. */
const MIN_LEAD_AGE = 18;

const yearsBetween = (from: Date, to: Date): number => {
  const years = to.getUTCFullYear() - from.getUTCFullYear();
  const beforeBirthday =
    to.getUTCMonth() < from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() < from.getUTCDate());
  return beforeBirthday ? years - 1 : years;
};

/**
 * Everything wrong with this contact, one entry per field. Empty means good.
 *
 * `on` is the day the booking is being made — passed in rather than read from
 * the clock, so the age rule is a pure function and a test can sit on either
 * side of a birthday without waiting a year.
 */
export const contactErrors = (
  vertical: Vertical,
  contact: Contact,
  on: string = today(),
): Validation[] => {
  const asked = contactFields(vertical);
  const errors: Validation[] = [];

  if (asked.includes('firstName') && !contact.firstName?.trim()) {
    errors.push(validation('firstName', 'REQUIRED'));
  }
  if (asked.includes('lastName') && !contact.lastName?.trim()) {
    errors.push(validation('lastName', 'REQUIRED'));
  }
  if (asked.includes('email')) {
    /* Deliberately the loosest possible check. An address is only really
       validated by sending to it, and a stricter pattern rejects real ones. */
    if (!contact.email?.trim()) errors.push(validation('email', 'REQUIRED'));
    else if (!contact.email.includes('@')) errors.push(validation('email', 'EMAIL_FORMAT'));
  }
  if (asked.includes('dateOfBirth')) {
    const born = contact.dateOfBirth ? new Date(`${contact.dateOfBirth}T00:00:00Z`) : undefined;
    if (!contact.dateOfBirth?.trim()) errors.push(validation('dateOfBirth', 'REQUIRED'));
    else if (!born || Number.isNaN(born.getTime())) errors.push(validation('dateOfBirth', 'DATE_INVALID'));
    else if (contact.dateOfBirth > on) errors.push(validation('dateOfBirth', 'DATE_FUTURE'));
    else if (yearsBetween(born, new Date(`${on}T00:00:00Z`)) < MIN_LEAD_AGE) {
      errors.push(validation('dateOfBirth', 'ADULT_REQUIRED'));
    }
  }

  return errors;
};

/** Today, as the `YYYY-MM-DD` the rest of this file compares against. */
export const today = (): string => new Date().toISOString().slice(0, 10);
