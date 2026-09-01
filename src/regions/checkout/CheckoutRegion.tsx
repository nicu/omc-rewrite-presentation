/* ============================================================================
   CHECKOUT  ·  region
   Everything here is bookkeeping: which step are we on, and what happens when
   one finishes. It does not know what any step contains, and it never will.

   It also does not decide which steps apply or whether one is finished — it
   asks the flow, which asks src/domain. This file has no business rules in it
   at all, which is the point.
   ========================================================================= */

import { Button, Stack, Surface, Text } from '../../components/primitives';
import { AccountSkeleton, FailurePanel } from '../../components/presenters';
import { WizardLayout, WizardSteps } from '../../components/layouts';
import { PriceDisplay } from '../../components/presenters';
import { priceFor } from '../../domain/pricing';
import { cartQuery } from '../../data/queries';
import { readDraft } from '../../data/draft';
import { useLoad } from '../../data/useLoad';
import { Analytics, useEmit } from '../../telemetry/context';
import { useBrand } from '../../app/brand';
import { useRouter } from '../../app/router';
import { CHECKOUT } from './checkoutFlow';
import { firstUnfinished, stepsFor } from './flow';

export const CheckoutRegion = ({ step }: { step?: string }) => {
  const brand = useBrand();
  const router = useRouter();
  const emit = useEmit();

  /* The brand may sell a different set of steps, and this booking may not need
     all of them. Both questions are pure, so they are asked wherever we have a
     cart — including in the callback below, before anything is drawn. */
  const flow = brand.checkoutFlow ?? CHECKOUT;

  /* A URL is a request, not a permission. Landing on a step this booking skips,
     or one whose answers are still missing, sends you where you should be.
     This runs once, when the cart arrives, because that is the first moment
     the question can be answered — and it is a callback, not an effect. */
  const { data, status, retry } = useLoad(
    { cart: cartQuery() },
    {
      onReady: ({ cart }) => {
        /* Three sources, one context: what the server knows, what the brand
           sells, and what this tab still remembers. */
        const ctx = { cart, brand: brand, draft: readDraft(cart.id) };
        const allowed = stepsFor(flow, ctx);
        const here = allowed.find((s) => s.id === step);
        const blocking = firstUnfinished(allowed, ctx);
        const sendTo =
          !here ? (blocking ?? allowed[allowed.length - 1])
          : blocking && allowed.indexOf(blocking) < allowed.indexOf(here) ? blocking
          : undefined;
        if (sendTo && sendTo.id !== step) router.replace({ name: 'checkout', step: sendTo.id });
      },
    },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') return <FailurePanel surface="page" message="We couldn't load your booking." onRetry={retry} />;

  const steps = stepsFor(flow, { cart: data.cart, brand: brand, draft: readDraft(data.cart.id) });
  const current = steps.find((s) => s.id === step);
  if (!current) return <AccountSkeleton />;   // the callback above is moving us

  const index = steps.indexOf(current);
  const price = priceFor(data.cart, brand);

  const done = () => {
    emit('CHECKOUT_STEP_COMPLETED', { step: current.id });
    /* Recomputed against the cart as it is now: answering one step can remove
       the next one. The list decides, not this function. */
    const next = steps[index + 1];
    if (next) router.go({ name: 'checkout', step: next.id });
    else router.go({ name: 'account' });
  };

  const goTo = (id: string) => router.go({ name: 'checkout', step: id });
  const previous = steps[index - 1];
  const { Step } = current;

  return (
    <WizardLayout
      progress={
        <Stack gap={3}>
          <Text variant="overline" tone="muted">Your booking</Text>
          <WizardSteps steps={steps} current={index} onSelect={goTo} />
        </Stack>
      }
      summary={
        price ? (
          <Surface tone="raised" pad="md" radius="lg" bordered>
            <Stack gap={3}>
              <Text variant="overline" tone="muted">Total</Text>
              <PriceDisplay price={price} unit="total" />
            </Stack>
          </Surface>
        ) : undefined
      }
      step={<Analytics name={current.analytics}><Step onDone={done} /></Analytics>}
      actions={
        previous ? (
          <Button variant="ghost" onClick={() => goTo(previous.id)}>
            &larr; Back to {previous.label.toLowerCase()}
          </Button>
        ) : undefined
      }
    />
  );
};
