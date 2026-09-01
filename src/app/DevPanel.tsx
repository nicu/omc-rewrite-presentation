/* ============================================================================
   DEV PANEL  ·  POC instrument
   Tenant switch, slot-API switch, failure injection, and the event log.
   Uses the same tokens as the app so it inherits each tenant's look.
   ========================================================================= */

import { useState } from 'react';

import { ChipChoice, SegmentedChoice, SelectChoice, Stack, Surface, Text } from '../components/atoms';
import { getChaos, setChaos, type Chaos } from '../data/mock/api';
import { cache } from '../data/cache';
import { eventLog } from '../telemetry/adapters';
import { TENANTS, type TenantId } from './tenant';
import { EventLog } from './EventLog';
import styles from './DevPanel.module.css';

export const DevPanel = ({ tenant, onTenant }: {
  tenant: TenantId; onTenant: (id: TenantId) => void;
}) => {
  const [open, setOpen] = useState(true);
  const [chaos, setChaosState] = useState<Chaos>(getChaos());
  const [destination, setDestination] = useState('appInsights');

  const applyChaos = (next: Chaos) => { setChaos(next); setChaosState(next); cache.reset(); };

  if (!open) {
    return (
      <button type="button" className={styles.reopen} onClick={() => setOpen(true)}>Controls</button>
    );
  }

  return (
    <aside className={styles.panel}>
      <Surface tone="raised" pad="md" radius="lg" elevation="modal">
        <Stack gap={5}>
          <Stack direction="horizontal" justify="between" align="center">
            <Text variant="overline" tone="muted">POC controls</Text>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Hide panel">×</button>
          </Stack>

          <Stack gap={2}>
            <Text variant="caption" tone="secondary">Tenant</Text>
            <ChipChoice
              ariaLabel="Tenant" value={tenant}
              options={Object.values(TENANTS).map((t) => ({ value: t.id, label: t.name }))}
              onChange={onTenant}
            />
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
