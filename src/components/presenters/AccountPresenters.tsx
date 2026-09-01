/* ============================================================================
   ACCOUNT PRESENTERS
   Small, pure, props-in. None of them import the store, the tenant, or a
   telemetry event name.
   ========================================================================= */

import { Badge, Button, Card, Stack, Surface, Text } from '../atoms';
import { ListItemLayout } from '../layouts';
import { useTracking, type TrackMap } from '../../telemetry/tracking';
import type { AccountPayload, PaymentPayload } from '../../telemetry/catalog';
import type { Booking, Certificate, MembershipTier, PaymentMethod } from '../../data/model';
import styles from './AccountPresenters.module.css';

/* --- identity ---------------------------------------------------------- */

export const TierBadge = ({ tier }: { tier: MembershipTier }) => (
  <Badge tone={tier === 'Standard' ? 'neutral' : 'solid'}>{tier} member</Badge>
);

/**
 * The account header. Membership and balances are both optional: a cash-retail
 * tenant has neither, and renders a plain header from the same component
 * rather than from a brand-specific one.
 */
export const BalanceSummary = ({ name, membership, balances }: {
  name: string;
  membership?: { tier: MembershipTier; since: string };
  balances: { label: string; value: number; unit: string }[];
}) => (
  <Surface tone="brand" pad="lg" radius="lg">
    <div className={styles.summary}>
      <Stack gap={2}>
        {membership && (
          <Text variant="overline" tone="onBrand">
            Member since {new Date(membership.since).getFullYear()}
          </Text>
        )}
        <Text variant="displayMd" tone="onBrand">{name}</Text>
        {membership && <TierBadge tier={membership.tier} />}
      </Stack>
      {balances.length > 0 && (
        <Stack direction="horizontal" gap={6} wrap>
          {balances.map((b) => (
            <Stack key={b.label} gap={1}>
              <Text variant="overline" tone="onBrand">{b.label}</Text>
              <Text variant="displayMd" tone="onBrand">
                {new Intl.NumberFormat('en-US').format(b.value)}
              </Text>
              <Text variant="caption" tone="onBrand">{b.unit}</Text>
            </Stack>
          ))}
        </Stack>
      )}
    </div>
  </Surface>
);

/* --- wallet ------------------------------------------------------------ */

type PaymentActions = { select: PaymentPayload };

export const PaymentMethodRow = ({ method, selected, onSelect, track }: {
  method: PaymentMethod; selected?: boolean; onSelect?: () => void; track?: TrackMap<PaymentActions>;
}) => {
  const t = useTracking<PaymentActions, { select: () => PaymentPayload }>(track, {
    select: () => ({ method: `${method.brand}-${method.last4}` }),
  });

  return (
    <Card padded onClick={() => { t.select(); onSelect?.(); }} ariaLabel={`${method.brand} ending ${method.last4}`}>
      <Stack direction="horizontal" gap={4} align="center" justify="between">
        <Stack direction="horizontal" gap={3} align="center">
          <span className={styles.cardMark} data-brand={method.brand}>{brandLabel[method.brand]}</span>
          <Stack gap={0}>
            <Text variant="body">···· {method.last4}</Text>
            <Text variant="caption" tone="muted">Expires {method.expiry}</Text>
          </Stack>
        </Stack>
        <Stack direction="horizontal" gap={2} align="center">
          {method.isDefault && <Badge tone="brand">Default</Badge>}
          {selected && <Badge tone="success">Selected</Badge>}
        </Stack>
      </Stack>
    </Card>
  );
};

const brandLabel: Record<PaymentMethod['brand'], string> = {
  visa: 'VISA', mastercard: 'MC', amex: 'AMEX',
};

/* --- certificates ------------------------------------------------------ */

type CertificateActions = { apply: AccountPayload };

export const CertificateRow = ({ certificate, onApply, track }: {
  certificate: Certificate; onApply?: () => void; track?: TrackMap<CertificateActions>;
}) => {
  const t = useTracking<CertificateActions, { apply: () => AccountPayload }>(track, {
    apply: () => ({ section: 'certificates' }),
  });

  return (
    <Card padded>
      <Stack direction="horizontal" gap={4} align="center" justify="between">
        <Stack gap={1}>
          <Text variant="body">{certificate.name}</Text>
          <Text variant="caption" tone="muted">
            Expires {new Date(certificate.expiresOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </Stack>
        <Stack direction="horizontal" gap={3} align="center">
          <Badge tone={statusTone[certificate.status]}>{certificate.status}</Badge>
          {certificate.status === 'available' && (
            <Button size="sm" variant="secondary" onClick={() => { t.apply(); onApply?.(); }}>Use</Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

const statusTone = { available: 'success', reserved: 'warning', used: 'neutral' } as const;

/* --- bookings ---------------------------------------------------------- */

export const BookingRow = ({ booking }: { booking: Booking }) => (
  /* The same layout as a search result, on a different page. */
  <ListItemLayout
    body={
      <Stack gap={1}>
        <Text variant="body">{booking.hotelName}</Text>
        <Text variant="caption" tone="muted">
          {booking.destination} &middot;{' '}
          {new Date(booking.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}{booking.nights} nights
        </Text>
      </Stack>
    }
    aside={
      <Stack gap={1} align="end">
        <Badge tone={booking.status === 'upcoming' ? 'brand' : 'neutral'}>{booking.status}</Badge>
        <Text variant="caption" tone="muted">{booking.paidWith}</Text>
      </Stack>
    }
  />
);

/* --- navigation -------------------------------------------------------- */

type NavActions = { open: AccountPayload };

export const AccountNav = ({ items, active, onSelect, track }: {
  items: { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
  track?: TrackMap<NavActions>;
}) => {
  const t = useTracking<NavActions, { open: (section: string) => AccountPayload }>(track, {
    open: (section) => ({ section }),
  });

  return (
    <>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.navItem}
          aria-current={item.id === active}
          onClick={() => { t.open(item.id); onSelect(item.id); }}
        >
          {item.label}
        </button>
      ))}
    </>
  );
};
