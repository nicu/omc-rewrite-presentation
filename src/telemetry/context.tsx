/* ============================================================================
   TELEMETRY CONTEXT  ·  "hybrid" model
   Ambient at the root: tenant, partner, business model, membership tier.
   Ambient per route: vertical.
   Explicit per region: the region name (passed to useLoad).
   Nothing below this file ever concatenates a name or re-derives a dimension.
   ========================================================================= */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { EventName, EventPayloadMap } from './catalog';
import type { Adapter } from './adapters';

export type AmbientContext = {
  tenant: string;
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
  /** Only useLoad passes this: it emits from above its own RegionScope, so it
   *  stamps the region itself. Presenters never supply it. */
  contextOverride?: Partial<AmbientContext>,
) => void;

const AmbientCtx = createContext<AmbientContext | null>(null);
const AdaptersCtx = createContext<Adapter[]>([]);

export const TelemetryRoot = ({
  children,
  adapters,
  ...ambient
}: AmbientContext & { adapters: Adapter[]; children: ReactNode }) => {
  const value = useMemo(() => ambient, [
    ambient.tenant, ambient.partner, ambient.brandKey,
    ambient.businessModel, ambient.membershipTier,
  ]);
  return (
    <AdaptersCtx.Provider value={adapters}>
      <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>
    </AdaptersCtx.Provider>
  );
};

/** One per route. The only nesting in the telemetry system. */
export const VerticalScope = ({ vertical, children }: { vertical: string; children: ReactNode }) => {
  const parent = useContext(AmbientCtx);
  const value = useMemo(() => ({ ...parent!, vertical }), [parent, vertical]);
  return <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>;
};

/** Set by useLoad from its `name` option, so failures and interactions agree. */
export const RegionScope = ({ region, children }: { region: string; children: ReactNode }) => {
  const parent = useContext(AmbientCtx);
  const value = useMemo(() => ({ ...parent!, region }), [parent, region]);
  return <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>;
};

export const useAmbient = (): AmbientContext =>
  useContext(AmbientCtx) ?? { tenant: '', partner: '', brandKey: '', businessModel: '' };

/**
 * The emitter presenters and regions use. No-ops outside a TelemetryRoot, which
 * is what keeps presenters renderable in isolation (Storybook, tests).
 */
export const useEmit = (): EmitFn => {
  const context = useContext(AmbientCtx);
  const adapters = useContext(AdaptersCtx);

  return useMemo<EmitFn>(
    () => (event, properties, contextOverride) => {
      if (!context) return;
      const payload: TelemetryEvent = {
        event,
        properties: properties as Record<string, unknown>,
        context: contextOverride ? { ...context, ...contextOverride } : context,
      };
      for (const adapter of adapters) adapter.send(payload);
    },
    [context, adapters],
  );
};
