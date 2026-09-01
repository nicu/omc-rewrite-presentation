import { useState } from 'react';

import { Stack } from '../../components/atoms';
import { FailurePanel, PaymentMethodRow, ResultListSkeleton } from '../../components/presenters';
import { paymentMethodsQuery } from '../../data/queries';
import { useLoad } from '../../data/useLoad';

export const WalletSection = () => {
  const [selected, setSelected] = useState<string>();

  const { data, status, retry, Scope } = useLoad(
    { methods: paymentMethodsQuery() },
    { name: 'account.wallet', pageView: 'ACCOUNT_SECTION_OPENED' },
  );

  if (status === 'loading') return <ResultListSkeleton count={3} />;
  if (status === 'error') return <FailurePanel message="We couldn't load your cards." onRetry={retry} />;

  return (
    <Scope>
      <Stack gap={3}>
        {data.methods.map((method) => (
          <PaymentMethodRow
            key={method.id}
            method={method}
            selected={selected === method.id}
            onSelect={() => setSelected(method.id)}
            track={{ select: 'PAYMENT_METHOD_SELECTED' }}
          />
        ))}
      </Stack>
    </Scope>
  );
};
