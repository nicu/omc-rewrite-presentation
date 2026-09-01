/* ============================================================================
   DEV PANEL  ·  POC instrument
   Brand switch, slot-API switch, failure injection, and the event log.
   Uses the same tokens as the app so it inherits each brand's look.
   ========================================================================= */

import { useState } from 'react';

import { ChipChoice, SegmentedChoice, SelectChoice, Stack, Surface, Text } from '../components/primitives';
import {
  getChaos, setChaos, getVolume, setVolume, getLongContent, setLongContent,
  getStaged, setStaged, getFailOffers, setFailOffers,
  type Chaos, type Volume,
} from '../data/mock/api';
import { cart as serverCart, resetCart } from '../data/mock/db';
import { cache } from '../data/cache';
import { clearDraft } from '../data/draft';
import { eventLog } from '../telemetry/adapters';
import { useRouter } from './router';
import { BRANDS } from '../brands';
import { type BrandId } from './brand';
import { EventLog } from './EventLog';
import styles from './DevPanel.module.css';

const PANEL_KEY = 'poc.controls';

export const DevPanel = ({ brand, onBrand }: {
  brand: BrandId; onBrand: (id: BrandId) => void;
}) => {
  /* Closed unless you asked for it. It used to open itself on any screen wider
     than 1100px, which meant it was sitting over the app before anyone had
     looked at the app — most obviously over the arrival after signing in. The
     instrument should not be the first thing on screen.

     Your choice is remembered for the tab, so opening it once during a
     demonstration does not mean reopening it after every reload. A stored
     choice is not the same as opening on its own: nothing opens this that you
     did not open. */
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(PANEL_KEY) === 'open'; } catch { return false; }
  });

  const showPanel = (next: boolean) => {
    setOpen(next);
    try { sessionStorage.setItem(PANEL_KEY, next ? 'open' : 'closed'); } catch { /* storage can be unavailable */ }
  };
  const [chaos, setChaosState] = useState<Chaos>(getChaos());
  const [volume, setVolumeState] = useState<Volume>(getVolume());
  const [longContent, setLongContentState] = useState(getLongContent());
  const [staged, setStagedState] = useState(getStaged());
  const [failOffers, setFailOffersState] = useState(getFailOffers());
  const [destination, setDestination] = useState('appInsights');
  const { go } = useRouter();

  /* Everything a booking left behind, in the three places it was kept: the
     cart on the server, the address in this tab, and what the cache was told.
     Signing out is in the header, because that is a thing a member does; this
     is not, so it lives here with the other instruments. */
  const startOver = () => {
    clearDraft(serverCart.id);
    resetCart();
    cache.reset();
    go({ name: 'landing' });
  };

  const applyChaos = (next: Chaos) => { setChaos(next); setChaosState(next); cache.reset(); };

  /* This changes what the server would return, so the cache has to forget what
     it was told before — otherwise the page keeps the old answer and the
     control looks broken. */
  const applyVolume = (next: Volume) => { setVolume(next); setVolumeState(next); cache.reset(); };
  const applyLongContent = (on: boolean) => { setLongContent(on); setLongContentState(on); cache.reset(); };
  const applyStaged = (on: boolean) => { setStaged(on); setStagedState(on); cache.reset(); };
  const applyFailOffers = (on: boolean) => { setFailOffers(on); setFailOffersState(on); cache.reset(); };

  if (!open) {
    return (
      <button type="button" data-poc="reopen" className={styles.reopen} onClick={() => showPanel(true)}>Controls</button>
    );
  }

  return (
    /* A stable hook for the sweep script. Class names are hashed by CSS
       modules and `[class*="_panel_"]` also matches the sign-in form's own
       panel, which is how the sweep silently walked the wrong list. */
    <aside data-poc="controls" className={styles.panel}>
      <Surface tone="raised" pad="md" radius="lg" elevation="modal">
        <Stack gap={5}>
          <Stack direction="horizontal" justify="between" align="center">
            <Text variant="overline" tone="muted">POC controls</Text>
            <button type="button" className={styles.close} onClick={() => showPanel(false)} aria-label="Hide panel">×</button>
          </Stack>

          <Stack gap={2}>
            <Text variant="caption" tone="secondary">Brand</Text>
            <ChipChoice
              ariaLabel="Brand" value={brand}
              options={Object.values(BRANDS).map((t) => ({ value: t.id, label: t.name }))}
              onChange={onBrand}
            />
          </Stack>

          <Stack gap={2}>
            <Text variant="caption" tone="secondary">Booking</Text>
            <button type="button" className={styles.action} onClick={startOver}>
              Start over
            </button>
            <Text variant="caption" tone="muted">
              Empties the cart and the saved address, and forgets the payment
              already taken &mdash; so the bank challenge happens again.
            </Text>
          </Stack>

          <Stack gap={2}>
            <Text variant="caption" tone="secondary">Inject failure</Text>
            <SegmentedChoice
              ariaLabel="Failure injection" value={chaos}
              options={[
                { value: 'none', label: 'None' },
                { value: 'fault', label: 'Fault' },
                { value: 'rejection', label: 'Rejection' },
              ]}
              onChange={applyChaos}
            />
            {/* Fails one request rather than all of them — the shape that shows
                what .optional() is for. The landing page loses its offers and
                arrives anyway. */}
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={failOffers}
                onChange={(e) => applyFailOffers(e.target.checked)}
              />
              <Text variant="caption" tone="secondary">Fail one request only</Text>
            </label>
          </Stack>

          <Stack gap={2}>
            <Text variant="caption" tone="secondary">Results</Text>
            <SelectChoice
              ariaLabel="Result volume" value={volume}
              options={[
                { value: 'normal', label: 'Original' },
                { value: 'empty',  label: 'No results' },
                { value: 'single', label: '1 result' },
              ]}
              onChange={(v) => applyVolume(v as Volume)}
            />
            {/* Its own switch, because how many rows there are and how big each
                one is break different things — and the interesting case is
                both at once. */}
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={longContent}
                onChange={(e) => applyLongContent(e.target.checked)}
              />
              <Text variant="caption" tone="secondary">Very long content</Text>
            </label>
            {/* What availability really does: answer with what it has, and a
                flag saying there is more. Off, every search finishes first
                time and the polling never shows. */}
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={staged}
                onChange={(e) => applyStaged(e.target.checked)}
              />
              <Text variant="caption" tone="secondary">Results arrive in stages</Text>
            </label>
          </Stack>

          <Stack gap={2}>
            <Stack direction="horizontal" justify="between" align="center">
              <Text variant="caption" tone="secondary">Emitted events</Text>
              <button type="button" className={styles.clear} onClick={eventLog.clear}>clear</button>
            </Stack>
            <SelectChoice
              ariaLabel="Destination" value={destination}
              options={[
                { value: 'appInsights', label: 'App Insights' },
                { value: 'posthog', label: 'PostHog' },
                { value: 'gtm', label: 'GTM' },
              ]}
              onChange={setDestination}
            />
            <div className={styles.logScroll}><EventLog destination={destination} /></div>
          </Stack>
        </Stack>
      </Surface>
    </aside>
  );
};
