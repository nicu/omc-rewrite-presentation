/* ============================================================================
   MY ACCOUNT  ·  region
   This page loads one thing: the member, for the header. Each section below
   is its own region and fetches what it needs when you open it — so a brand
   without certificates never loads certificates.
   ========================================================================= */

import { AccountLayout, Container } from '../components/layouts';
import { AccountNav, AccountSkeleton, BalanceSummary, FailurePanel } from '../components/presenters';
import { Analytics } from '../telemetry/context';
import { userQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { failureMessage } from '../errors/messages';
import { hasLoyalty } from '../brands';
import { useBrand } from '../app/brand';
import { useRouter } from '../app/router';

export const AccountRegion = ({ section }: { section?: string }) => {
  const brand = useBrand();
  const router = useRouter();

  /* Which tab is open is in the URL, so it can be linked to and the back
     button steps between tabs. The brand decides which tabs exist, so an
     unknown one falls back to the first rather than showing nothing. */
  const active = brand.accountSections.some((s) => s.id === section)
    ? section! : brand.accountSections[0].id;
  const setActive = (id: string) => router.go({ name: 'account', section: id });

  const { data, status, error, retry } = useLoad(
    { user: userQuery() },
    { pageView: 'ACCOUNT_VIEWED' },
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
  const balances = !hasLoyalty(brand) ? [] :
    brand.defaultBusinessModel === 'earn-burn'
      ? [{ label: 'Available', value: data.user.balances.miles ?? 0, unit: 'miles' }]
      : [{ label: 'Points', value: data.user.balances.points ?? 0, unit: 'redeemable' }];

  const panel = brand.accountSections.find((s) => s.id === active) ?? brand.accountSections[0];

  return (
    <Container>
      <AccountLayout
        summary={
          <BalanceSummary
            name={`${data.user.firstName} ${data.user.lastName}`}
            membership={
              hasLoyalty(brand)
                ? { tier: data.user.tier, since: data.user.memberSince }
                : undefined
            }
            balances={balances}
          />
        }
        nav={
          <AccountNav
            items={brand.accountSections}
            active={active}
            onSelect={setActive}
            track={{ open: 'ACCOUNT_SECTION_OPENED' }}
          />
        }
      >
        <Analytics name={panel.analytics}><panel.Panel /></Analytics>
      </AccountLayout>
    </Container>
  );
};
