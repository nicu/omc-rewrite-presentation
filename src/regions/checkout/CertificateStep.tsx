/* Only brands that sell certificates list this step. Nothing else changes —
   it is one more entry in an array. */

import { useState } from 'react';

import { Button, Stack, Surface, Text } from '../../components/primitives';
import { AccountSkeleton, CertificateRow, FailurePanel } from '../../components/presenters';
import { certificatesQuery } from '../../data/queries';
import { api } from '../../data/mock/api';
import { cache } from '../../data/cache';
import { useLoad } from '../../data/useLoad';
import { today, usableCertificates } from '../../domain';
import { useToast } from '../../app/useToast';
import type { StepProps } from './flow';

export const CertificateStep = ({ onDone }: StepProps) => {
  const { showFailure } = useToast();
  const [chosen, setChosen] = useState<string>();

  const { data, status, retry } = useLoad(
    { certificates: certificatesQuery() },
    { pageView: 'CHECKOUT_STEP_VIEWED', onFailure: showFailure },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') return <FailurePanel message="We couldn't load your certificates." onRetry={retry} />;

  const use = async (id: string) => {
    setChosen(id);
    await api.updateCart({ certificateId: id });
    cache.invalidateTag('cart');
    onDone();
  };

  /* Which of them can actually be spent is a question about the business, so
     the answer comes from src/domain and this step only draws what survived.
     A reserved or expired one is not a row with a disabled button; it is not
     on this page at all. */
  const usable = usableCertificates(data.certificates, today());

  return (
    <Surface tone="raised" pad="lg" radius="lg" bordered>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text variant="heading">Use a certificate?</Text>
          <Text variant="caption" tone="secondary">
            {usable.length
              ? 'You can pay the rest with a card on the next step.'
              : 'None of your certificates can be used on this booking.'}
          </Text>
        </Stack>
        <Stack gap={3}>
          {usable.map((certificate) => (
            <CertificateRow
              key={certificate.id}
              certificate={certificate}
              onApply={() => use(certificate.id)}
              track={{ apply: 'CERTIFICATE_APPLIED' }}
            />
          ))}
        </Stack>
        <Button variant="secondary" size="lg" disabled={Boolean(chosen)} onClick={onDone}>
          {usable.length ? 'Skip, pay in full' : 'Continue'}
        </Button>
      </Stack>
    </Surface>
  );
};
