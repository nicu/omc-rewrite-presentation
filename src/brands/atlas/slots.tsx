import { Badge, Text } from '../../components/atoms';

export const MembershipBanner = () => (
  <Text variant="caption" tone="inverse">
    Double miles on every stay of three nights or more through 31 March.
  </Text>
);

export const SignInAside = () => <Badge tone="solid">Members earn 5&times; on direct bookings</Badge>;

export const FooterNote = () => (
  <Text variant="caption" tone="muted">
    Atlas Rewards is operated under licence. Miles expire after 24 months of inactivity.
  </Text>
);
