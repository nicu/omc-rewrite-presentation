/* ============================================================================
   TELEMETRY CONTEXT  ·  "hybrid" model
   Ambient at the root: brand, partner, business model, membership tier.
   Everything else comes from <Analytics>, which wraps a region from outside.

   Outside matters. useLoad runs as a hook, so it cannot see a provider that
   its own component renders — put the wrapper inside and the name has to be
   handed to useLoad as well, and the same string then lives in two places in
   one file. From outside, one wrapper serves both: the hook reads context and
   everything below inherits it.

   Nothing below this file ever concatenates a name or re-derives a dimension.
   ========================================================================= */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DESTINATIONS, type EventName, type EventPayloadMap } from './catalog';
import type { Adapter } from './adapters';

export type AmbientContext = {
  brand: string;
  partner: string;
  brandKey: string;
  businessModel: string;
  membershipTier?: string;
  vertical?: string;
  region?: string;
};

export type TelemetryEvent = {
  event: EventName;
  properties: Record<string, unknown>;
  context: AmbientContext;
};

type EmitFn = <E extends EventName>(
  event: E,
  properties: EventPayloadMap[E],
) => void;

const AmbientCtx = createContext<AmbientContext | null>(null);
const AdaptersCtx = createContext<Adapter[]>([]);

export const TelemetryRoot = ({
  children,
  adapters,
  ...ambient
}: AmbientContext & { adapters: Adapter[]; children: ReactNode }) => {
  const value = useMemo(() => ambient, [
    ambient.brand, ambient.partner, ambient.brandKey,
    ambient.businessModel, ambient.membershipTier,
  ]);
  return (
    <AdaptersCtx.Provider value={adapters}>
      <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>
    </AdaptersCtx.Provider>
  );
};

/**
 * Names one region, and everything that happens inside it: the region's own
 * load and failure events, and every action a presenter below reports.
 *
 * `vertical` is set where a page starts and inherited by anything nested, so
 * a checkout step inside a stays flow does not repeat it. `businessModel`
 * overrides the root's default for pages where the reader chose how to pay —
 * without it, a search filtered to certificates reports the brand's default.
 */
export const Analytics = ({ name, vertical, businessModel, children }: {
  name: string;
  vertical?: string;
  businessModel?: string;
  children: ReactNode;
}) => {
  const parent = useContext(AmbientCtx);
  const value = useMemo(() => ({
    ...parent!,
    region: name,
    ...(vertical ? { vertical } : {}),
    ...(businessModel ? { businessModel } : {}),
  }), [parent, name, vertical, businessModel]);
  return <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>;
};

export const useAmbient = (): AmbientContext =>
  useContext(AmbientCtx) ?? { brand: '', partner: '', brandKey: '', businessModel: '' };

/**
 * The emitter presenters and regions use. No-ops outside a TelemetryRoot, which
 * is what keeps presenters renderable in isolation (Storybook, tests).
 */
export const useEmit = (): EmitFn => {
  const context = useContext(AmbientCtx);
  const adapters = useContext(AdaptersCtx);

  return useMemo<EmitFn>(
    () => (event, properties) => {
      if (!context) return;
      const payload: TelemetryEvent = {
        event,
        properties: properties as Record<string, unknown>,
        context,
      };
      const allowed = DESTINATIONS[event];
      for (const adapter of adapters) {
        if (allowed && !allowed.includes(adapter.name as never)) continue;
        adapter.send(payload);
      }
    },
    [context, adapters],
  );
};
