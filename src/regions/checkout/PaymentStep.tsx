/* ============================================================================
   CONFIRM AND PAY  ·  step
   The one place in the prototype where something happens that cannot be
   undone, and the only one that has to deal with being interrupted.

   The sequence is written out here, in order, in a function you can read:

     nothing owed   ->  confirm     -> book, no card and no issuer
     something owed ->  authorise   -> authorised -> book
                                    -> challenge  -> hand over to the bank, come
                                       back on a URL, authorise again with the
                                       token it gave us

   None of that is a rule, so none of it is in src/domain. It is orchestration:
   our job, even though the answers are the server's.
   ========================================================================= */

import { useState } from 'react';

import { Badge, Button, Modal, Stack, Surface, Text } from '../../components/primitives';
import { AccountSkeleton, FailurePanel, PriceDisplay } from '../../components/presenters';
import { cartQuery } from '../../data/queries';
import { api, EXPECTED_TOKEN } from '../../data/mock/api';
import { clearDraft } from '../../data/draft';
import { useLoad } from '../../data/useLoad';
import { useEmit } from '../../telemetry/context';
import { useToast } from '../../app/useToast';
import { useRouter } from '../../app/router';
import { useBrand } from '../../app/brand';
import { amountStillOwed, priceFor } from '../../domain/pricing';
import type { StepProps } from './flow';

export const PaymentStep = ({ onDone }: StepProps) => {
  const { showFailure, showMessage } = useToast();
  const brand = useBrand();
  const router = useRouter();
  const emit = useEmit();
  const [paying, setPaying] = useState(false);
  const [challenge, setChallenge] = useState<string>();

  /* What the bank hands back on the return URL, if this is a return. */
  const token = router.route.name === 'checkout' ? router.route.auth : undefined;

  /* One function, used by the button and by the return from the bank. The only
     difference between the two is whether we have a token yet.

     `owed` decides which call is made. A booking a certificate has covered
     outright has no card behind it and no issuer to ask, so putting it through
     the card path produced a bank challenge for a payment of nothing. */
  const settle = async (cartId: string, owed: number | undefined, authToken?: string) => {
    setPaying(true);
    try {
      const result = owed === 0
        ? await api.confirm(cartId)
        : await api.authorise(cartId, authToken);
      if (result.status === 'challenge') {
        emit('PAYMENT_CHALLENGED', { step: 'payment' });
        setChallenge(result.challengeId);
        return;
      }
      emit('CHECKOUT_COMPLETED', { step: 'payment' });
      clearDraft(cartId);   // nothing in it should outlive the booking
      showMessage('success', 'Booked. Your confirmation is on its way.');
      onDone();
    } catch (error) {
      // Drop a token the bank rejected, so refreshing does not try it again.
      if (authToken) router.replace({ name: 'checkout', step: 'payment' });
      showFailure(error as never);
    } finally {
      setPaying(false);
    }
  };

  const { data, status, retry } = useLoad(
    { cart: cartQuery() },
    {
      pageView: 'CHECKOUT_STEP_VIEWED',
      onFailure: showFailure,
      /* Coming back from the bank. There is nothing to restore — the step is an
         address and the cart is on the server — so we take the token off the
         URL and finish the call that was interrupted. */
      onReady: ({ cart }) => {
        if (token) void settle(cart.id, amountStillOwed(cart, brand), token);
      },
    },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') return <FailurePanel message="We couldn't load your booking." onRetry={retry} />;

  const price = priceFor(data.cart, brand);
  const owed = amountStillOwed(data.cart, brand);

  /* Standing in for leaving the site and being sent back. A real one is a
     redirect to the issuer; the part that matters — that we come back on a
     URL carrying a token — is the same. */
  const returnFromBank = (approved: boolean) => {
    setChallenge(undefined);
    router.go({ name: 'checkout', step: 'payment', auth: approved ? EXPECTED_TOKEN : 'tok_declined' });
  };

  return (
    <>
      <Surface tone="raised" pad="lg" radius="lg" bordered>
        <Stack gap={5}>
          <Text variant="heading">Confirm and pay</Text>
          <Stack direction="horizontal" gap={4} align="center" justify="between">
            <Stack gap={1}>
              <Text variant="body">{data.cart.itemName}</Text>
              <Text variant="caption" tone="muted">{data.cart.itemDetail}</Text>
              {data.cart.certificateId && <Badge tone="success">Certificate applied</Badge>}
            </Stack>
            {price && <PriceDisplay price={price} unit="total" />}
          </Stack>
          <Button size="lg" disabled={paying} onClick={() => settle(data.cart.id, owed)}>
            {paying ? (owed === 0 ? 'Booking…' : 'Taking payment…')
              : owed === 0 ? 'Confirm booking' : 'Pay and book'}
          </Button>
        </Stack>
      </Surface>

      <Modal
        open={Boolean(challenge)}
        title="Your bank needs to check"
        actions={
          <>
            <Button variant="ghost" onClick={() => returnFromBank(false)}>Cancel</Button>
            <Button onClick={() => returnFromBank(true)}>Approve</Button>
          </>
        }
      >
        <Stack gap={3}>
          <Text variant="body">
            This payment needs confirming with your bank before it can go through.
          </Text>
          <Text variant="caption" tone="muted">
            Standing in for a redirect to the issuer. Approving sends you back to
            this step with a token on the URL, and the same request runs again.
          </Text>
        </Stack>
      </Modal>
    </>
  );
};
