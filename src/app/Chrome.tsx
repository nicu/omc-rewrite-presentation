/* ============================================================================
   APP CHROME
   Header and footer as slot-filled layouts. The old repo has separate header
   components per brand (StandardHeaderContent, ATGStandardHeader, …) plus a
   48-value ComponentType enum to choose between them. Here the differences
   are tokens plus two optional slots.
   ========================================================================= */

import { useState, type ReactNode } from 'react';

import { Button, Modal, Stack, Surface, Text } from '../components/primitives';
import { Container } from '../components/layouts';
import { Analytics } from '../telemetry/context';
import { useBrand } from './brand';
import styles from './Chrome.module.css';

/** One place you can go. A list, not a run of JSX — which is what lets the
 *  header draw the same four destinations as a row on a wide screen and as a
 *  menu on a narrow one. A slot holding opaque children could only be shown
 *  or hidden, and hiding it is how the items used to be lost. */
export type NavItem = {
  id: string;
  label: string;
  active?: boolean;
  onSelect: () => void;
};

export const AppHeader = ({ nav = [], actions }: { nav?: NavItem[]; actions?: ReactNode }) => {
  const brand = useBrand();
  const MembershipBanner = brand.overrides?.chrome?.MembershipBanner;
  const brandActions = brand.overrides?.chrome?.headerActions ?? [];
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (item: NavItem) => { setMenuOpen(false); item.onSelect(); };

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
            <span className={styles.logo}>{brand.name}</span>

            {/* The row. CSS hides it when there is no room for it. */}
            <nav className={styles.nav}>
              {nav.map((item) => (
                <NavLink key={item.id} active={item.active} onClick={item.onSelect}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <Stack direction="horizontal" gap={3} align="center">
              {/* The brand's own, then the app's. Each one is named where it
                  is listed, so a thing in the header that loads reports under
                  its own region without the header knowing it exists. */}
              {brandActions.map(({ id, analytics, Action }) => (
                <Analytics key={id} name={analytics}><Action /></Analytics>
              ))}
              {actions}
              {/* …and the same list again, for when it does not. Only one of
                  the two is ever on screen. */}
              {nav.length > 0 && (
                <button
                  type="button"
                  className={styles.menuButton}
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
                >
                  <span className={styles.menuIcon} aria-hidden="true" />
                </button>
              )}
            </Stack>
          </div>
        </Container>
      </Surface>

      {/* A dialog, so it is the brand's own surface — glass on Halo, paper on
          Kiosk — and so focus and Escape are somebody else's problem. */}
      <Modal open={menuOpen} title={brand.name} onClose={() => setMenuOpen(false)}>
        <nav className={styles.menuList}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.menuItem}
              aria-current={item.active}
              onClick={() => go(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </Modal>
    </header>
  );
};

export const AppFooter = () => {
  const brand = useBrand();
  const FooterNote = brand.overrides?.chrome?.FooterNote;
  return (
    <Surface tone="sunken" as="footer">
      <Container>
        <div className={styles.footer}>
          <Stack gap={2}>
            <Text variant="title">{brand.name}</Text>
            <Text variant="caption" tone="muted">{brand.tagline}</Text>
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

/**
 * Signing in and out, and nothing else. Getting *to* the account is a
 * destination, so it is in `nav` with the other destinations — where the brand
 * also gets to call it "My rewards" or "My trips". This used to offer "My
 * account" as well, which was the same page under a third name, two inches
 * from the nav item that already went there.
 */
export const HeaderActions = ({ signedIn, onSignIn, onSignOut }: {
  signedIn: boolean; onSignIn: () => void; onSignOut: () => void;
}) =>
  signedIn
    ? <Button size="sm" variant="secondary" onClick={onSignOut}>Sign out</Button>
    : <Button size="sm" onClick={onSignIn}>Sign in</Button>;
