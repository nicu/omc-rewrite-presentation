import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Fragment, useState, type ReactNode } from 'react';

import { AppShell as DefaultAppShell } from '../components/layouts';
import { Analytics, TelemetryRoot } from '../telemetry/context';
import { appInsightsAdapter, gtmAdapter, posthogAdapter } from '../telemetry/adapters';
import { AccountRegion } from '../regions/AccountRegion';
import { HotelLandingRegion } from '../regions/HotelLandingRegion';
import { CheckoutRegion } from '../regions/checkout';
import { FlightSearchRegion } from '../regions/FlightSearchRegion';
import { HotelDetailsRegion } from '../regions/HotelDetailsRegion';
import { HotelSearchRegion } from '../regions/HotelSearchRegion';
import { SignInRegion } from '../regions/SignInRegion';
import { ToastHost } from '../components/presenters';
import { Arrival } from '../components/primitives';
import { AppFooter, AppHeader, HeaderActions } from './Chrome';
import { DevPanel } from './DevPanel';
import { RouterProvider, useRouter } from './router';
import { takeArrival } from './arrival';
import { signOut, useSession } from './session';
import { BRANDS } from '../brands';
import { hasLoyalty, payingWith } from '../domain';
import { BrandProvider, useBrand, type BrandId } from './brand';

const adapters = [appInsightsAdapter, posthogAdapter, gtmAdapter];

/* Brand tokens must land on the document root: semantic tokens are declared
   on :root, so they resolve against :root's primitives. Themed on a wrapper
   div instead, the overrides would never reach them. */
const applyBrand = (id: BrandId) => { document.documentElement.dataset.brand = id; };

/* Which brand is in the address bar, so a reload — or a hot reload mid-edit —
   comes back as the brand you were looking at rather than the default. It is
   a query parameter rather than part of the hash route because a brand is not
   a page: every route is reachable in every brand, and the route should not
   have to carry it.

   Untrusted, like everything else that arrives this way, so it is checked
   against the brands that exist instead of being cast. */
const BRAND_PARAM = 'brand';

const brandFromUrl = (): BrandId => {
  const asked = new URLSearchParams(window.location.search).get(BRAND_PARAM);
  return asked && asked in BRANDS ? (asked as BrandId) : 'atlas';
};

const writeBrandToUrl = (id: BrandId) => {
  const url = new URL(window.location.href);
  url.searchParams.set(BRAND_PARAM, id);
  /* replace, not push: switching brand is changing the demo you are looking
     at, not somewhere you should have to press Back through. */
  window.history.replaceState(null, '', url);
};

const FIRST_BRAND: BrandId = brandFromUrl();
applyBrand(FIRST_BRAND);

export const App = () => {
  const [brandId, setBrandId] = useState<BrandId>(FIRST_BRAND);
  const brand = BRANDS[brandId];

  /* Switching brand is something someone does, so it is written where they do
     it rather than watched for afterwards. */
  const changeBrand = (id: BrandId) => {
    applyBrand(id);
    writeBrandToUrl(id);
    setBrandId(id);
  };

  return (
    /* Ambient telemetry identity, set once. Nothing below rebuilds it. */
    <TelemetryRoot
      adapters={adapters}
      brand={brand.id}
      partner={brand.analytics.partner}
      brandKey={brand.analytics.brandKey}
      businessModel={brand.defaultBusinessModel}
      membershipTier="Gold"
    >
      {/* The brand's MUI theme. It also emits CSS variables, which our layout
          stylesheets read — so components and layouts stay in step. */}
      <ThemeProvider theme={brand.theme}>
        <CssBaseline />
        <BrandProvider brand={brand}>
        <RouterProvider>
          <Pages />
          <ToastHost />
          <DevPanel brand={brandId} onBrand={changeBrand} />
        </RouterProvider>
        </BrandProvider>
      </ThemeProvider>
    </TelemetryRoot>
  );
};

/* Takes the one-shot on mount and hands it to the animation. Keyed by route
   where it is used, so it is a fresh question on each page rather than a value
   kept in step with anything. */
const PageArrival = ({ children }: { children: ReactNode }) => {
  const [arriving] = useState(takeArrival);
  return <Arrival active={arriving}>{children}</Arrival>;
};

const Pages = () => {
  const { route, go } = useRouter();
  const brand = useBrand();
  const signedIn = useSession();

  /* Sign-in is full-bleed: it opts out of the shell rather than the shell
     growing a variant for it. */
  if (route.name === 'signin') {
    return <Analytics name="auth.signin" vertical="account"><SignInRegion /></Analytics>;
  }

  /* Most brands take the shared chrome. Halo does not. */
  const AppShell = brand.overrides?.chrome?.AppShell ?? DefaultAppShell;

  return (
    <PageArrival key={route.name}>
    <AppShell
      header={
        <AppHeader
          nav={[
            { id: 'landing', label: 'Stays', active: route.name === 'landing',
              onSelect: () => go({ name: 'landing' }) },
            /* A stay sits inside the stays vertical, so the nav says so. */
            { id: 'search', label: 'Stays search', active: route.name === 'search' || route.name === 'stay',
              onSelect: () => go({ name: 'search', destination: '' }) },
            { id: 'flights', label: 'Flights', active: route.name === 'flights',
              onSelect: () => go({ name: 'flights', destination: '' }) },
            { id: 'account', label: hasLoyalty(brand) ? 'My rewards' : 'My trips',
              active: route.name === 'account', onSelect: () => go({ name: 'account' }) },
          ]}
          actions={
            <HeaderActions
              signedIn={signedIn || route.name === 'account'}
              onSignIn={() => go({ name: 'signin' })}
              /* Signing out is a place change as well as a state change: the
                 account page you were on is not yours any more. */
              onSignOut={() => { signOut(); go({ name: 'landing' }); }}
            />
          }
        />
      }
      footer={<AppFooter />}
    >
      {/* One <Analytics> per route, naming the region every event below it is
          tagged with. Keyed by brand so switching brands remounts regions: in
          production a brand is a separate deployment, so region state never
          crosses over. */}
      <Fragment key={brand.id}>
        {route.name === 'landing' && (
          <Analytics name="hotel.landing" vertical="hotel"><HotelLandingRegion /></Analytics>
        )}
        {route.name === 'search' && (
          <Analytics name="hotel.search" vertical="hotel" businessModel={payingWith(brand, route.pay)}>
            <HotelSearchRegion destination={route.destination} sort={route.sort} pay={route.pay} />
          </Analytics>
        )}
        {route.name === 'stay' && (
          <Analytics name="hotel.details" vertical="hotel" businessModel={payingWith(brand, route.pay)}>
            <HotelDetailsRegion id={route.id} pay={route.pay} />
          </Analytics>
        )}
        {route.name === 'flights' && (
          <Analytics name="air.search" vertical="air" businessModel={payingWith(brand, route.pay)}>
            <FlightSearchRegion destination={route.destination} sort={route.sort} pay={route.pay} />
          </Analytics>
        )}
        {/* Keyed by arrival, not just by step: opening a step by link, by Back, or
            by being sent back from a bank are all arrivals, and each one should run
            the region's checks. The cart is cached, so this is not a refetch. */}
        {route.name === 'checkout' && (
          <Analytics name="checkout" vertical="hotel">
            <CheckoutRegion key={`${route.step}${route.auth ? ':return' : ''}`} step={route.step} />
          </Analytics>
        )}
        {route.name === 'account' && (
          <Analytics name="account" vertical="account"><AccountRegion section={route.section} /></Analytics>
        )}
      </Fragment>
    </AppShell>
    </PageArrival>
  );
};

