/* ============================================================================
   BILLING  ·  what is wrong with the address given so far
   Same shape as the traveller rules, and here for the same reason: the step
   was deciding whether Continue was pressable with one spelling of this, and
   the flow was deciding whether the step was finished with another. The two
   had already drifted — the flow asked whether a billing address existed at
   all, the step asked whether three named fields were filled — so adding a
   field to the form would have left the flow believing the step was done.
   ========================================================================= */

import type { BillingAddress } from '../data/draft';
// Explicit extension: run directly by `node --test`.
import { validation, type Validation } from '../errors/failure.ts';

/** Everything wrong with this address, one entry per field. Empty means good. */
export const billingAddressErrors = (address: BillingAddress = {}): Validation[] => {
  const errors: Validation[] = [];
  /* No format rules. A postcode is a different shape in every country we
     sell in, and a regex that rejects a real one is worse than a typo the
     payment provider will catch. */
  if (!address.line1?.trim()) errors.push(validation('line1', 'REQUIRED'));
  if (!address.city?.trim()) errors.push(validation('city', 'REQUIRED'));
  if (!address.postcode?.trim()) errors.push(validation('postcode', 'REQUIRED'));
  return errors;
};
