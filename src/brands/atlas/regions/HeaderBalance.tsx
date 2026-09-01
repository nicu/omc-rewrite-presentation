/* ============================================================================
   HEADER BALANCE  ·  a region this brand drops into the shared header
   Atlas puts your mile balance beside the account button. Nothing else does.

   It is a region rather than a presenter because it loads its own data — the
   header has none to give it. That is the whole point of the slot: a brand can
   put something in the header that fetches, without the header knowing that
   anything in it fetches.

   In the app we are replacing, this one element is why a brand owns a private
   copy of the header, and why that copy then misses every later fix.
   ========================================================================= */

import { Text } from '../../../components/primitives';
import { userQuery } from '../../../data/queries';
import { useLoad } from '../../../data/useLoad';

export const HeaderBalance = () => {
  const { data, status } = useLoad({ user: userQuery() });

  /* Nothing while it loads, and nothing if it fails. A header that changes
     width after the page has settled is worse than a header without a
     balance in it — and this is the one element on the page nobody came for. */
  if (status !== 'ready' || data.user.balances.miles === undefined) return null;

  return (
    <Text variant="caption" tone="secondary">
      {data.user.balances.miles.toLocaleString('en-US')} miles
    </Text>
  );
};
