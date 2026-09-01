/* ============================================================================
   MY ACCOUNT  ·  region
   This page loads one thing: the member, for the header. Each section below
   is its own region and fetches what it needs when you open it — so a brand
   without certificates never loads certificates.
   ========================================================================= */

import { useState } from 'react';

import { AccountLayout, Container } from '../components/layouts';
import { AccountNav, AccountSkeleton, BalanceSummary, FailurePanel } from '../components/presenters';
import { userQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { failureMessage } from '../errors/messages';
import { hasLoyalty } from '../brands';
import { useTenant } from '../app/tenant';

export const AccountRegion = ({ section }: { section?: string }) => {
  const tenant = useTenant();
  const [active, setActive] = useState(section ?? tenant.accountSections[0].id);

  const { data, status, error, retry, Scope } = useLoad(
    { user: userQuery() },
    { name: 'account', pageView: 'ACCOUNT_VIEWED' },
  );

  if (status === 'loading') return <AccountSkeleton />;
  if (status === 'error') {
    return (
      <Container>
        <FailurePanel surface="page" message={failureMessage(error)} onRetry={retry} />
      </Container>
    );
  }

  /* What a balance even is depends on how the brand charges. */
  const balances = !hasLoyalty(tenant) ? [] :
    tenant.defaultBusinessModel === 'earn-burn'
      ? [{ label: 'Available', value: data.user.balances.miles ?? 0, unit: 'miles' }]
      : [{ label: 'Points', value: data.user.balances.points ?? 0, unit: 'redeemable' }];

  const { Panel } = tenant.accountSections.find((s) => s.id === active) ?? tenant.accountSections[0];

  return (
    <Scope>
      <Container>
        <AccountLayout
          summary={
            <BalanceSummary
              name={`${data.user.firstName} ${data.user.lastName}`}
              membership={
                hasLoyalty(tenant)
                  ? { tier: data.user.tier, since: data.user.memberSince }
                  : undefined
              }
              balances={balances}
            />
          }
          nav={
            <AccountNav
              items={tenant.accountSections}
              active={active}
              onSelect={setActive}
              track={{ open: 'ACCOUNT_SECTION_OPENED' }}
            />
          }
        >
          <Panel />
        </AccountLayout>
      </Container>
    </Scope>
  );
};
