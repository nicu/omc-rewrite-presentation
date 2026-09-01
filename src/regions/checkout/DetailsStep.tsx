import { useState } from 'react';

import { Button, Field, Stack, Surface, Text } from '../../components/primitives';
import { AccountSkeleton, FailurePanel } from '../../components/presenters';
import type { Cart, Contact } from '../../data/model';
import { cartQuery } from '../../data/queries';
import { api } from '../../data/mock/api';
import { cache } from '../../data/cache';
import { useLoad } from '../../data/useLoad';
import { contactErrors, contactFields } from '../../domain';
import { failureMessage } from '../../errors/messages';
import { useToast } from '../../app/useToast';
import type { StepProps } from './flow';

/** A step is a region: it loads what it needs and names itself. */
export const DetailsStep = ({ onDone }: StepProps) => {
  const { showFailure } = useToast();

  const { data, status, retry } = useLoad(
    { cart: cartQuery() },
    { pageView: 'CHECKOUT_STEP_VIEWED', onFailure: showFailure },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') return <FailurePanel message="We couldn't load your booking." onRetry={retry} />;

  return <DetailsForm cart={data.cart} onDone={onDone} />;
};

/* The form starts from the cart, not from an empty string. That is what makes
   Back work: come back to this step and your answers are still here, because
   they were never held in this component — they were saved. */
const DetailsForm = ({ cart, onDone }: { cart: Cart } & StepProps) => {
  const [contact, setContact] = useState<Contact>(cart.contact ?? {});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof Contact) => (value: string) =>
    setContact((current) => ({ ...current, [field]: value }));
  const blur = (field: keyof Contact) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  /* Which fields this booking asks for, and what is wrong with them. Both
     answers come from src/domain — the same `contactErrors` the checkout flow
     calls to decide whether this step is finished. One rule, asked twice: once
     about what is on screen, once about what was saved. They cannot drift. */
  const asked = contactFields(cart.vertical);
  const errors = contactErrors(cart.vertical, contact);
  const errorFor = (field: keyof Contact) => {
    const failure = errors.find((e) => e.field === field);
    /* Only after you have left the field, or tried to submit. Telling someone
       their email is invalid while they are still typing the local part is
       correct and useless. */
    return failure && touched[field] ? failureMessage(failure) : undefined;
  };

  const save = async () => {
    if (errors.length) {
      return setTouched(Object.fromEntries(asked.map((field) => [field, true])));
    }
    setSaving(true);
    // The cart is the state. Nothing is kept on the client between steps.
    await api.updateCart({ contact });
    cache.invalidateTag('cart');
    setSaving(false);
    onDone();
  };

  return (
    <Surface tone="raised" pad="lg" radius="lg" bordered>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text variant="heading">Who is travelling?</Text>
          <Text variant="caption" tone="secondary">{cart.itemName} &middot; {cart.itemDetail}</Text>
        </Stack>
        <Stack direction="horizontal" gap={4}>
          <Field
            label="First name" value={contact.firstName ?? ''}
            onChange={set('firstName')} onBlur={blur('firstName')} error={errorFor('firstName')}
          />
          <Field
            label="Last name" value={contact.lastName ?? ''}
            onChange={set('lastName')} onBlur={blur('lastName')} error={errorFor('lastName')}
          />
        </Stack>
        <Field
          label="Email" type="email" value={contact.email ?? ''}
          onChange={set('email')} onBlur={blur('email')} error={errorFor('email')}
          hint="Your confirmation goes here"
        />
        {/* Rendered because the rule asks for it, not because this is a flight.
            A vertical that stops needing it stops listing it, and this line
            does not change. */}
        {asked.includes('dateOfBirth') && (
          <Field
            label="Date of birth" type="date" value={contact.dateOfBirth ?? ''}
            onChange={set('dateOfBirth')} onBlur={blur('dateOfBirth')} error={errorFor('dateOfBirth')}
            hint="The airline needs this for the lead passenger"
          />
        )}
        <Button size="lg" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </Stack>
    </Surface>
  );
};
