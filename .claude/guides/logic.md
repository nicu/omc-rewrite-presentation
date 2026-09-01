# Business logic

"Business logic" is **four different things**, and they belong in four different
places. Almost every mess in the live repo is one of them sitting where another
should be.

| Kind | What it is | Where it goes |
|---|---|---|
| **Derive** | A pure answer from what we already have: a price, a total, what is still owed | `src/domain/*.ts` — pure functions, no React |
| **Decide** | A yes or no that changes what happens: does this step apply, is it finished, is this offered | `src/domain/*.ts`, called from config |
| **Shape** | Turning the API's shapes into ours | `src/data/queries.ts` — see `.claude/guides/data.md` |
| **Commit** | Making something happen, in order, once | a region's handler |

## Derive

`src/domain/pricing.ts`, `checkout.ts`, `membership.ts` — 4 files, 90 lines, no
React anywhere in them.

```ts
businessModelFor(cart, brand)      // which way this booking is being paid for
priceFor(hotel, businessModel)     // the number to show
amountStillOwed(cart, brand)       // after a certificate
certificateCoversTotal(cart)       // …
hasLoyalty(brand)
```

**Why they are not inline:** written inline, a rule stops looking like a rule. It
looks like a bit of rendering, so the next person writing a similar screen writes it
again slightly differently, and now there are two pricing rules. A named function in
`src/domain` is greppable, testable and quotable.

Rules:

- **Pure.** Arguments in, answer out. No hooks, no fetching, no `Date.now()` unless
  the time is passed in.
- **Import with the extension** — `from './pricing.ts'`. Node's test runner runs
  these files directly and will not guess.
- **Named for the question, not the caller.** `amountStillOwed`, not
  `getPaymentStepAmount`.
- Export through `src/domain/index.ts`.

## Decide

The same pure functions, used as predicates by configuration. This is what turns a
fixed sequence into one that responds to the cart:

```ts
export type FlowStep = {
  id: string;
  label: string;
  Step: ComponentType<StepProps>;
  when?: (ctx: CheckoutContext) => boolean;   // absent means "always"
  done?: (ctx: CheckoutContext) => boolean;   // absent means "we cannot tell"
};
```

- `stepsFor(flow, ctx)` — the steps this booking actually has.
- `firstUnfinished(steps, ctx)` — where someone who pasted a link to a later step
  gets sent instead.

Apply a certificate that covers the total and the billing step **stops existing**,
because there is nothing left to put on a card. No component was told about
certificates.

`CheckoutContext` is `{ cart, brand, draft }` — so a predicate cannot tell which
store answered.

## Shape

See `.claude/guides/data.md`. The query is the only place the API's oddities are
allowed to exist.

## Commit

Ours to **sequence**, not ours to **decide**. What money and inventory do is a
backend rule; a copy on the client is a copy that drifts.

A commit lives in a region's handler and must be:

- **Named** — one function, called by everything that causes it. The 3DS flow in
  `PaymentStep` has a single `authorise`, used both by the button and by the
  return-from-bank. Two entry points, one path.
- **Idempotent at the boundary** — the same key produces the same outcome, so a
  double-tap or a re-entered page cannot double-charge. The live repo has *nothing*
  named "idempotent"; something is presumably protecting us, but no code on our side
  says what.
- **Explicit about its steps** — show a modal, redirect, read a token from the URL,
  retry. Sequencing is exactly what a region is for.
- **Cleaning up after itself** — `clearDraft(cartId)` on success; drop a spent
  token from the URL with `router.replace` so a refresh cannot replay it.

Resuming from a redirect happens in `onReady`, **not an effect**.

## Adding a checkout step

1. Write the step as an **ordinary region** — it fetches what it needs and knows
   nothing about the wizard. `onDone` is the only thing it says upward, and the
   flow never asks why.
2. Add predicates to `src/domain/checkout.ts` if the step is conditional.
3. Add a line to the brand's `checkoutFlow`:
   ```ts
   { id: 'certificate', label: 'Certificate', Step: CertificateStep,
     when: offersCertificates, done: certificateAnswered }
   ```
4. The wizard only keeps count — it does not learn what the step is.
5. Every step has an address (`#/checkout?step=billing`), so Back works and a link
   can be pasted. The region validates the step against the flow in `onReady`.

## Tests

`node --test src/domain/*.test.ts` — Node 24 runs `.ts` directly. **No test
framework is installed and none should be.** Tests cover `src/domain` only: they
are table tests over pure functions, need no browser, and take milliseconds.

Add a case when you add a rule. Do not add tests for components — that is not what
this prototype is arguing about.
