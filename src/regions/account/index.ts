/* The account panels, and the telemetry name of each.

   The name sits here rather than inside the panel because <Analytics> wraps
   the panel from outside — and here rather than in each brand's config so
   that six brands cannot end up reporting the same panel under six names.
   A brand spreads one of these and supplies its own label. */

export { OverviewSection } from './OverviewSection';
export { TripsSection } from './TripsSection';
export { WalletSection } from './WalletSection';
export { CertificatesSection } from './CertificatesSection';

import { OverviewSection } from './OverviewSection';
import { TripsSection } from './TripsSection';
import { WalletSection } from './WalletSection';
import { CertificatesSection } from './CertificatesSection';

export const OVERVIEW     = { id: 'overview',     analytics: 'account.overview',     Panel: OverviewSection };
export const TRIPS        = { id: 'bookings',     analytics: 'account.trips',        Panel: TripsSection };
export const WALLET       = { id: 'wallet',       analytics: 'account.wallet',       Panel: WalletSection };
export const CERTIFICATES = { id: 'certificates', analytics: 'account.certificates', Panel: CertificatesSection };
