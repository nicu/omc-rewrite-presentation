import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { AppShell } from '../components/layouts';
import { VerticalScope, TelemetryRoot } from '../telemetry/context';
import { appInsightsAdapter, gtmAdapter, posthogAdapter } from '../telemetry/adapters';
import { AccountRegion } from '../regions/AccountRegion';
import { HotelLandingRegion } from '../regions/HotelLandingRegion';
import { FlightSearchRegion } from '../regions/FlightSearchRegion';
import { HotelSearchRegion } from '../regions/HotelSearchRegion';
import { SignInRegion } from '../regions/SignInRegion';
import { ToastHost } from '../components/presenters';
import { AppFooter, AppHeader, HeaderActions, NavLink } from './Chrome';
import { DevPanel } from './DevPanel';
import { RouterProvider, useRouter } from './router';
import { hasLoyalty } from '../brands';
import { TENANTS, TenantProvider, useTenant, type TenantId } from './tenant';

const adapters = [appInsightsAdapter, posthogAdapter, gtmAdapter];

export const App = () => {
  const [tenantId, setTenantId] = useState<TenantId>('atlas');
  const tenant = TENANTS[tenantId];

  /* Tenant tokens must land on the document root: semantic tokens are declared
     on :root, so they resolve against :root's primitives. Themed on a wrapper
     div instead, the overrides would never reach them. */
  useEffect(() => { document.documentElement.dataset.tenant = tenantId; }, [tenantId]);

  return (
    /* Ambient telemetry identity, set once. Nothing below rebuilds it. */
    <TelemetryRoot
      adapters={adapters}
      tenant={tenant.id}
      partner={tenant.analytics.partner}
      brandKey={tenant.analytics.brandKey}
      businessModel={tenant.defaultBusinessModel}
      membershipTier="Gold"
    >
      {/* The brand's MUI theme. It also emits CSS variables, which our layout
          stylesheets read — so components and layouts stay in step. */}
      <ThemeProvider theme={tenant.theme}>
        <CssBaseline />
        <TenantProvider tenant={tenant}>
        <RouterProvider>
          <Pages />
          <ToastHost />
          <DevPanel tenant={tenantId} onTenant={setTenantId} />
        </RouterProvider>
        </TenantProvider>
      </ThemeProvider>
    </TelemetryRoot>
  );
};

const Pages = () => {
  const { route, go } = useRouter();
  const tenant = useTenant();

  /* Sign-in is full-bleed: it opts out of the shell rather than the shell
     growing a variant for it. */
  if (route.name === 'signin') {
    return <VerticalScope vertical="account"><SignInRegion /></VerticalScope>;
  }

  return (
    <AppShell
      header={
        <AppHeader
          nav={
            <>
              <NavLink active={route.name === 'landing'} onClick={() => go({ name: 'landing' })}>Stays</NavLink>
              <NavLink active={route.name === 'search'} onClick={() => go({ name: 'search', destination: '' })}>Stays search</NavLink>
              <NavLink active={route.name === 'flights'} onClick={() => go({ name: 'flights', destination: '' })}>Flights</NavLink>
              <NavLink active={route.name === 'account'} onClick={() => go({ name: 'account' })}>
                {hasLoyalty(tenant) ? "My rewards" : "My trips"}
              </NavLink>
            </>
          }
          actions={
            <HeaderActions
              signedIn={route.name === 'account'}
              onAccount={() => go({ name: 'account' })}
              onSignIn={() => go({ name: 'signin' })}
            />
          }
        />
      }
      footer={<AppFooter />}
    >
      {/* One VerticalScope per route — the only telemetry nesting in the app.
          Keyed by tenant so switching brands remounts regions: in production a
          tenant is a separate deployment, so region state never crosses over. */}
      <VerticalScope key={tenant.id} vertical={verticalFor(route.name)}>
        {route.name === 'landing' && <HotelLandingRegion />}
        {route.name === 'search'  && <HotelSearchRegion destination={route.destination} />}
        {route.name === 'flights' && <FlightSearchRegion destination={route.destination} />}
        {route.name === 'account' && <AccountRegion section={route.section} />}
      </VerticalScope>
    </AppShell>
  );
};

/** The vertical every event on this route is tagged with. */
const verticalFor = (route: string) =>
  route === 'account' ? 'account' : route === 'flights' ? 'air' : 'hotel';
