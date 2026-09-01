# Telemetry

The goal is that you can answer **"what does this page send to analytics?"** by
reading one page. Today it takes reading 41 places that build event names by hand.

## Never use Application Insights

Every adapter in `src/telemetry/adapters.ts` is a mock writing to an in-memory log
the dev panel reads. `appInsightsAdapter` carries that name only to mirror the
legacy naming in the real repo. **No SDK, no network call, no key, no
instrumentation string.** This is not negotiable and has been asked for explicitly.

## A presenter offers, an instance names

```tsx
// the presenter declares what can happen to it, and what each action produces
type Actions = { impression: ProductPayload; select: ProductPayload };

export const HotelResultCard = ({ hotel, track, onSelect }: {
  track?: TrackMap<Actions>;
  …
}) => {
  const t = useTracking<Actions, …>(track, {
    impression: () => ({ productId: hotel.id, … }),
    select:     () => ({ productId: hotel.id, … }),
  });
  …
};
```

```tsx
// the call site decides which of those are actually reported
<HotelResultCard track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED' }} … />
<HotelResultCard … />   {/* on the account page: silent, and it costs nothing */}
```

Why it is built this way:

- **A layout does neither.** It has nothing to offer and nothing to name.
- **Unmapped actions are no-ops**, so a presenter never writes
  `track?.select && emit(...)`.
- **Builders run only when the action is mapped and fired**, so an uninstrumented
  card in a 200-item list computes nothing.
- **The types stop the classic mistake.** `TrackMap` only accepts catalog events
  whose payload is satisfied by that action, so
  `track={{ select: 'SEARCH_SORTED' }}` on a product card is a compile error.

## The catalog

`src/telemetry/catalog.ts` holds every event name and its payload shape. Adding an
event means adding it there, once. Prefer reusing an existing payload
(`ProductPayload`, `SearchRefinePayload`, `AuthPayload`, `EmptyPayload`) over
inventing a shape.

Never build an event name from a string at a call site. That is the thing this
whole mechanism exists to remove.

## Ambient dimensions

Set once, never passed down, never rebuilt at a call site:

- `TelemetryRoot` — brand, partner, brandKey, business model, membership tier.
- `<Analytics name vertical>` — one per region, wrapped from **outside** it. It
  sets the region name and, where a page starts, the vertical. It also takes
  `businessModel`, for a page where the reader chose how to pay.

`useLoad` names nothing. It reads the region from context, which is why the
wrapper has to be outside the component: a hook cannot see a provider that its
own component renders, and a name in two places is a name that drifts.

So a card does not know its brand, its vertical or its region, and every event it
sends is tagged with all three.

## Failures

A `rejection` emits `OPERATION_FAILED` with `{ kind, code, region, retryable }` —
from the region that owns the mutation, not from the presenter. `validation` never
reaches analytics: it is a field-level message, not an incident.

## Checklist

- New event → `catalog.ts`, with a payload type that already exists if possible.
- New presenter action → add to its `Actions` map and its builders; name it nowhere.
- New page → a `pageView` on its `useLoad`.
- Never add a destination, an adapter with real I/O, or a key.
