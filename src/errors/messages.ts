/* ============================================================================
   FAILURE MESSAGES
   Our API does not return error codes, so there is no code -> copy table.
   A rejection carries the message the API sent; everything else falls back to
   a generic line. In the real app these strings come from i18n `errors`.
   ========================================================================= */

import type { Failure } from './failure';

const generic: Record<Failure['kind'], string> = {
  fault: 'Something went wrong. Please try again.',
  rejection: "We couldn't complete that request.",
  validation: 'Please check the highlighted fields.',
};

/** Field-level validation text. The one place a code IS ours, not the API's. */
const validation: Record<string, string> = {
  REQUIRED: 'This field is required',
  EMAIL_FORMAT: 'Enter a valid email address',
  PASSWORD_SHORT: 'Use at least 8 characters',
  DATE_INVALID: 'Enter a date as YYYY-MM-DD',
  DATE_FUTURE: 'This date is in the future',
  ADULT_REQUIRED: 'The lead traveller must be 18 or over',
};

export const failureMessage = (failure: Failure): string => {
  if (failure.kind === 'validation') return validation[failure.code] ?? generic.validation;
  if (failure.kind === 'rejection') return failure.message ?? generic.rejection;
  return generic.fault;
};
