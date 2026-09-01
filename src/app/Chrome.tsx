/* ============================================================================
   APP CHROME
   Header and footer as slot-filled layouts. The old repo has separate header
   components per brand (StandardHeaderContent, ATGStandardHeader, …) plus a
   48-value ComponentType enum to choose between them. Here the differences
   are tokens plus two optional slots.
   ========================================================================= */

import type { ReactNode } from 'react';

import { Button, Stack, Surface, Text } from '../components/atoms';
import { Container } from '../components/layouts';
import { useTenant } from './tenant';
import styles from './Chrome.module.css';

export const AppHeader = ({ nav, actions }: { nav?: ReactNode; actions?: ReactNode }) => {
  const tenant = useTenant();
  const MembershipBanner = tenant.overrides?.MembershipBanner;
  return (
    <header className={styles.header}>
      {MembershipBanner && (
        <Surface tone="inverse">
          <Container>
            <div className={styles.banner}><MembershipBanner /></div>
          </Container>
        </Surface>
      )}
      <Surface tone="raised">
        <Container>
          <div className={styles.bar}>
            <span className={styles.logo}>{tenant.name}</span>
            <nav className={styles.nav}>{nav}</nav>
            <Stack direction="horizontal" gap={3} align="center">{actions}</Stack>
          </div>
        </Container>
      </Surface>
    </header>
  );
};

export const AppFooter = () => {
  const tenant = useTenant();
  const FooterNote = tenant.overrides?.FooterNote;
  return (
    <Surface tone="sunken" as="footer">
      <Container>
        <div className={styles.footer}>
          <Stack gap={2}>
            <Text variant="title">{tenant.name}</Text>
            <Text variant="caption" tone="muted">{tenant.tagline}</Text>
          </Stack>
          <div className={styles.footerNote}>{FooterNote && <FooterNote />}</div>
        </div>
      </Container>
    </Surface>
  );
};

export const NavLink = ({ children, active, onClick }: {
  children: ReactNode; active?: boolean; onClick: () => void;
}) => (
  <button type="button" className={styles.navLink} aria-current={active} onClick={onClick}>
    {children}
  </button>
);

export const HeaderActions = ({ signedIn, onAccount, onSignIn }: {
  signedIn: boolean; onAccount: () => void; onSignIn: () => void;
}) =>
  signedIn
    ? <Button size="sm" variant="secondary" onClick={onAccount}>My account</Button>
    : <Button size="sm" onClick={onSignIn}>Sign in</Button>;
