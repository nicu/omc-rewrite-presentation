import { billingComplete, contactComplete, offersCertificates, requiresBilling } from '../../domain/checkout';
import { BillingStep } from './BillingStep';
import { CertificateStep } from './CertificateStep';
import { DetailsStep } from './DetailsStep';
import { PaymentStep } from './PaymentStep';
import type { Flow } from './flow';

/** What most brands sell. */
export const CHECKOUT: Flow = [
  {
    id: 'details', analytics: 'checkout.details', label: 'Your details', Step: DetailsStep,
    done: contactComplete,
  },
  {
    id: 'billing', analytics: 'checkout.billing', label: 'Payment method', Step: BillingStep,
    when: requiresBilling,
    done: billingComplete,
  },
  {
    id: 'payment', analytics: 'checkout.payment', label: 'Confirm and pay', Step: PaymentStep,
  },
];

/** Meridian sells certificates, so it has one more step. That is the change.
 *  `when` is what keeps it honest: a brand that stops selling them does not
 *  need the step removed, and applying one that covers the whole booking
 *  removes the billing step underneath it. */
export const CHECKOUT_WITH_CERTIFICATES: Flow = [
  {
    id: 'details', analytics: 'checkout.details', label: 'Your details', Step: DetailsStep,
    done: contactComplete,
  },
  {
    id: 'certificate', analytics: 'checkout.certificate', label: 'Certificates', Step: CertificateStep,
    when: offersCertificates,
    // Skipping is a real answer, so this step is never what blocks you.
    done: () => true,
  },
  {
    id: 'billing', analytics: 'checkout.billing', label: 'Payment method', Step: BillingStep,
    when: requiresBilling,
    done: billingComplete,
  },
  {
    id: 'payment', analytics: 'checkout.payment', label: 'Confirm and pay', Step: PaymentStep,
  },
];
