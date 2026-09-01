/* A section is a region. It fetches what it needs, when it is shown. */

import { Stack } from '../../components/atoms';
import { BookingRow, FailurePanel, ResultListSkeleton } from '../../components/presenters';
import { bookingsQuery } from '../../data/queries';
import { useLoad } from '../../data/useLoad';

export const TripsSection = () => {
  const { data, status, retry, Scope } = useLoad(
    { bookings: bookingsQuery() },
    { name: 'account.trips', pageView: 'ACCOUNT_SECTION_OPENED' },
  );

  if (status === 'loading') return <ResultListSkeleton count={3} />;
  if (status === 'error') return <FailurePanel message="We couldn't load your trips." onRetry={retry} />;

  return (
    <Scope>
      <Stack gap={3}>
        {data.bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
      </Stack>
    </Scope>
  );
};
