/* ============================================================================
   PAYMENT METHOD  ·  step
   The step whose answers live in two places, because they have to:

     the chosen card    -> the cart, because the server will take it
     the billing address -> the draft, because it will not, and because an
                            address has no business being in a URL

   Nothing below decides that. It saves each answer where that answer lives,
   and `billingComplete` in src/domain asks about both without knowing which
   is which.
   ========================================================================= */

import { useState } from 'react';

import { Button, Field, Stack, Surface, Text } from '../../components/primitives';
import { AccountSkeleton, FailurePanel, PaymentMethodRow } from '../../components/presenters';
import type { Cart } from '../../data/model';
import { cartQuery, paymentMethodsQuery } from '../../data/queries';
import { api } from '../../data/mock/api';
import { cache } from '../../data/cache';
import { readDraft, writeDraft, type BillingAddress } from '../../data/draft';
import { useLoad } from '../../data/useLoad';
import { billingAddressErrors } from '../../domain';
import { failureMessage } from '../../errors/messages';
import { useToast } from '../../app/useToast';
import type { StepProps } from './flow';

export const BillingStep = ({ onDone }: StepProps) => {
  const { showFailure } = useToast();

  /* Two requests, started together — the same as any other page. */
  const { data, status, retry } = useLoad(
    { cart: cartQuery(), methods: paymentMethodsQuery() },
    { pageView: 'CHECKOUT_STEP_VIEWED', onFailure: showFailure },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') return <FailurePanel message="We couldn't load your cards." onRetry={retry} />;

  return (
    <BillingForm cart={data.cart} methods={data.methods} onDone={onDone} />
  );
};

const BillingForm = ({ cart, methods, onDone }: {
  cart: Cart;
  methods: { id: string }[];
} & StepProps) => {
  /* Each field starts from wherever its answer was kept, so coming back to
     this step — by Back, by refresh, or from the bank — finds it filled in. */
  const draft = readDraft(cart.id);
  const [picked, setPicked] = useState(cart.paymentMethodId);
  const [address, setAddress] = useState<BillingAddress>(draft.billingAddress ?? {});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof BillingAddress) => (value: string) =>
    setAddress((current) => ({ ...current, [field]: value }));
  const blur = (field: keyof BillingAddress) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  /* The same function `billingComplete` calls to decide whether this step is
     finished — asked here about what is on screen instead of what was saved.
     The step used to spell the rule out itself, and the two had already
     drifted: the flow asked whether an address existed, this asked whether
     three named fields were filled. */
  const errors = billingAddressErrors(address);
  const errorFor = (field: keyof BillingAddress) => {
    const failure = errors.find((e) => e.field === field);
    return failure && touched[field] ? failureMessage(failure) : undefined;
  };

  const save = async () => {
    if (!picked || errors.length) {
      return setTouched({ line1: true, city: true, postcode: true });
    }
    setSaving(true);
    writeDraft(cart.id, { billingAddress: address });
    await api.updateCart({ paymentMethodId: picked });
    cache.invalidateTag('cart');
    setSaving(false);
    onDone();
  };

  return (
    <Surface tone="raised" pad="lg" radius="lg" bordered>
      <Stack gap={5}>
        <Text variant="heading">How would you like to pay?</Text>
        <Stack gap={3}>
          {methods.map((method) => (
            <PaymentMethodRow
              key={method.id}
              method={method as never}
              selected={picked === method.id}
              onSelect={() => setPicked(method.id)}
              track={{ select: 'PAYMENT_METHOD_SELECTED' }}
            />
          ))}
        </Stack>

        <Stack gap={1}>
          <Text variant="overline" tone="muted">Billing address</Text>
          <Text variant="caption" tone="secondary">
            Kept in this tab only, until the booking is paid for.
          </Text>
        </Stack>
        <Field
          label="Address" value={address.line1 ?? ''}
          onChange={set('line1')} onBlur={blur('line1')} error={errorFor('line1')}
        />
        <Stack direction="horizontal" gap={4}>
          <Field
            label="Town or city" value={address.city ?? ''}
            onChange={set('city')} onBlur={blur('city')} error={errorFor('city')}
          />
          <Field
            label="Postcode" value={address.postcode ?? ''}
            onChange={set('postcode')} onBlur={blur('postcode')} error={errorFor('postcode')}
          />
        </Stack>

        <Button size="lg" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </Stack>
    </Surface>
  );
};
