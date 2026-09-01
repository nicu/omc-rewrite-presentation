/* ============================================================================
   DESTINATION ADAPTERS
   The whole point: components emit ONE semantic event; each destination
   formats it its own way. In the real rewrite this is where byte-identical
   legacy naming is preserved — see appInsightsAdapter below.
   ========================================================================= */

import type { EventName } from './catalog';
import type { TelemetryEvent } from './context';

export type Adapter = { name: string; send: (e: TelemetryEvent) => void };

/** Ambient dimensions every destination gets, merged once, here. */
const dimensions = ({ context }: TelemetryEvent) => ({
  /* The one place the old word survives. Every dashboard, funnel and saved
     query downstream is keyed on `tenant`; renaming it here would make this
     rewrite a reporting migration as well. Our code says brand, the wire says
     tenant. */
  tenant: context.brand,
  partner: context.partner,
  brandKey: context.brandKey,
  businessModel: context.businessModel,
  membershipTier: context.membershipTier,
  vertical: context.vertical,
  region: context.region,
});

/**
 * Reproduces Frontend/src/hooks/useAppInsights.tsx:
 *   `${partnerKey}_${brandKey}_${vertical}_${eventType}`
 * One place to diff against production instead of the 41 call sites that
 * build this string by hand today.
 */
export const appInsightsAdapter: Adapter = {
  name: 'appInsights',
  send: (e) => {
    const { partner, brandKey, vertical } = e.context;
    const name = [partner || 'PARTNER', brandKey, vertical ?? 'GLOBAL', e.event].join('_');
    sink('appInsights', name, { ...dimensions(e), ...e.properties });
  },
};

/**
 * PostHog: Title_Case names, snake_case properties, and person properties
 * split out from event properties.
 */
export const posthogAdapter: Adapter = {
  name: 'posthog',
  send: (e) => {
    const name = e.event
      .toLowerCase()
      .replace(/(^|_)([a-z])/g, (_, sep: string, ch: string) => (sep ? '_' : '') + ch.toUpperCase());
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries({ ...dimensions(e), ...e.properties })) {
      props[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
    }
    sink('posthog', name, props);
  },
};

/**
 * GTM/GA4 is the one that really differs: it wants a nested `ecommerce`
 * object with GA4's own field names, and product events have to become an
 * `items` array. This is the mapping that would otherwise be copy-pasted
 * into every call site.
 */
const GA4_NAMES: Partial<Record<EventName, string>> = {
  PRODUCT_VIEWED: 'view_item',
  PRODUCT_SELECTED: 'select_item',
  SEARCH_PERFORMED: 'search',
  SEARCH_RESULTS_VIEWED: 'view_item_list',
};

export const gtmAdapter: Adapter = {
  name: 'gtm',
  send: (e) => {
    const name = GA4_NAMES[e.event] ?? e.event.toLowerCase();
    const p = e.properties as Record<string, unknown>;
    const payload: Record<string, unknown> = { ...dimensions(e) };

    if ('productId' in p) {
      payload.ecommerce = {
        currency: 'USD',
        items: [{
          item_id: p.productId,
          item_name: p.productName,
          item_list_id: p.listId,
          item_category: e.context.vertical,
          index: p.position,
          price: p.price,
        }],
      };
    } else {
      Object.assign(payload, p);
    }
    sink('gtm', name, payload);
  },
};

/* --- POC sink: an in-memory log the UI can render -------------------- */

export type LogLine = { seq: number; destination: string; name: string; props: Record<string, unknown> };

let seq = 0;
/* Replaced, never mutated: useSyncExternalStore compares snapshots by
   reference, so an in-place push would never re-render the log. */
let lines: LogLine[] = [];
const listeners = new Set<() => void>();

const sink = (destination: string, name: string, props: Record<string, unknown>) => {
  lines = [{ seq: seq++, destination, name, props }, ...lines].slice(0, 200);
  listeners.forEach((l) => l());
};

export const eventLog = {
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  snapshot: () => lines,
  clear: () => { lines = []; listeners.forEach((l) => l()); },
};
