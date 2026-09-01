import { Badge, Text } from '../../../components/primitives';

export const MembershipBanner = () => (
  <Text variant="caption" tone="inverse">
    Gold and above: complimentary room upgrade on stays booked before September.
  </Text>
);

export const SignInAside = () => <Badge tone="solid">Your tier price is applied automatically</Badge>;

export const FooterNote = () => (
  <Text variant="caption" tone="muted">
    Member rates require an active Meridian Club membership. Certificates are non-transferable.
  </Text>
);
