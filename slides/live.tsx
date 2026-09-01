/* ============================================================================
   LIVE SPECIMENS
   Real components from src/, mounted into the slides.

   A deck that describes components and then draws pictures of them is asking
   to be believed. These are the components: the same files the application
   imports, under the same brand themes, re-rendered when the brand selector
   changes. If a card is broken in Kiosk, the slide about that card is broken
   in Kiosk too.

   Put `<div data-live="hotel-card"></div>` in a slide and it appears there.
   ========================================================================= */

import { ThemeProvider } from '@mui/material/styles';
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';

import { BRANDS, type BrandId } from '../src/brands';
import { BalanceSummary } from '../src/components/presenters';
import { HotelResultCard, PriceDisplay } from '../src/components/presenters';
import { Stack, Text } from '../src/components/primitives';
import { hotels } from '../src/data/mock/db';
import type { BusinessModelId } from '../src/data/model';
import { EventLog } from '../src/app/EventLog';
import { Analytics, TelemetryRoot } from '../src/telemetry/context';
import { appInsightsAdapter, eventLog, gtmAdapter, posthogAdapter } from '../src/telemetry/adapters';

const hotel = hotels[0];

/* The card, wired up exactly as the search page wires it, next to the log the
   adapters write to. Click it and the event appears — the same code path the
   application runs, not a mock of it. */
const Instrumented = ({ brand }: { brand: BrandId }) => (
  <TelemetryRoot
    adapters={[appInsightsAdapter, posthogAdapter, gtmAdapter]}
    brand={BRANDS[brand].id}
    partner={BRANDS[brand].analytics.partner}
    brandKey={BRANDS[brand].analytics.brandKey}
    businessModel={BRANDS[brand].defaultBusinessModel}
    membershipTier="Gold"
  >
    <Analytics name="hotel.search" vertical="hotel">
      <Stack gap={4}>
        <HotelResultCard
          hotel={hotel}
          businessModel={BRANDS[brand].defaultBusinessModel}
          position={0}
          listId="slides"
          track={{
            impression: 'PRODUCT_VIEWED',
            select: 'PRODUCT_SELECTED',
            expand: 'PRODUCT_EXPANDED',
            infoRequested: 'PRODUCT_INFO_REQUESTED',
          }}
        />
        <button type="button" className="clearlog" onClick={eventLog.clear}>clear</button>
        <Text variant="caption" tone="muted">What the adapters received</Text>
        <div className="loglive"><EventLog destination="appInsights" /></div>
      </Stack>
    </Analytics>
  </TelemetryRoot>
);

/** What each `data-live` name draws. Keep them small: a slide is not a page. */
const SPECIMENS: Record<string, (brand: BrandId) => ReactNode> = {
  'hotel-card': (brand) => (
    <HotelResultCard hotel={hotel} businessModel={BRANDS[brand].defaultBusinessModel} />
  ),

  /* The same card with a different way of paying. Nothing about the component
     changes — the price is a union and this is a different arm of it. */
  'hotel-card-points': () => (
    <HotelResultCard hotel={hotel} businessModel="earn-burn" />
  ),

  /* The brand's own card, where it has one. Falls back to the shared card,
     which is the point: five of the six brands have no card of their own. */
  'hotel-card-override': (brand) => {
    const Card = BRANDS[brand].overrides?.verticals?.hotel?.ResultCard ?? HotelResultCard;
    return <Card hotel={hotel} businessModel={BRANDS[brand].defaultBusinessModel} />;
  },

  'prices': () => (
    <Stack direction="horizontal" gap={7} wrap>
      {(['cash', 'earn-burn', 'tier-rewards', 'certificates'] as BusinessModelId[])
        .filter((m) => hotel.prices[m])
        .map((m) => <PriceDisplay key={m} price={hotel.prices[m]!} />)}
    </Stack>
  ),

  /* The account header. It arrives as a sequence rather than three things that
     happen to move at once, and a brand without `animates` gets it still. */
  'card-events': (brand) => <Instrumented brand={brand} />,

  'rewards-header': () => (
    <BalanceSummary
      name="Nicu"
      membership={{ tier: 'Gold', since: '2019-04-12' }}
      balances={[{ label: 'Miles', value: 132_400, unit: 'miles' }]}
    />
  ),
};

const roots = new Map<Element, Root>();

/** Mounts or re-renders every specimen on the page under the given brand. */
export const showLive = (brand: BrandId) => {
  for (const host of document.querySelectorAll<HTMLElement>('[data-live]')) {
    const draw = SPECIMENS[host.dataset.live ?? ''];
    if (!draw) { host.textContent = `no specimen named "${host.dataset.live}"`; continue; }

    let root = roots.get(host);
    if (!root) { root = createRoot(host); roots.set(host, root); }
    /* Keyed by brand so the subtree remounts: entrance animations play again
       when you switch, which is most of what these slides are showing. */
    root.render(
      <ThemeProvider key={brand} theme={BRANDS[brand].theme}>
        {draw(brand)}
      </ThemeProvider>,
    );
  }
};
