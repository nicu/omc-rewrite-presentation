/* ============================================================================
   CERTIFICATES  ·  which of them can actually be spent
   The rule was living in a presenter — `CertificateRow` showed a Use button
   whenever the status said "available", and never looked at the expiry it was
   printing two lines above. So an expired certificate offered a button, and
   the account page offered one that called nothing.

   A presenter draws a certificate. Deciding which ones a member may spend is
   a question about the business, so it is answered here and the call site
   hands down the ones that survived.
   ========================================================================= */

import type { Certificate } from '../data/model';

/**
 * The certificates that can be applied to a booking made on `on`.
 *
 * `expiresOn` is an ISO `YYYY-MM-DD`, and ISO dates in that form sort as
 * strings — so this is a string comparison on purpose, not a Date parse that
 * would drag a timezone into a question that has none.
 */
export const usableCertificates = (all: Certificate[], on: string): Certificate[] =>
  all.filter((certificate) => certificate.status === 'available' && certificate.expiresOn >= on);
