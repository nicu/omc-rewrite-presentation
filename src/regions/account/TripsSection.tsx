/* A section is a region. It fetches what it needs, when it is shown. */

import { Reveal, Stack } from '../../components/primitives';
import { BookingRow, FailurePanel, ResultListSkeleton } from '../../components/presenters';
import { bookingsQuery } from '../../data/queries';
import { useLoad } from '../../data/useLoad';

export const TripsSection = () => {
  const { data, status, retry } = useLoad(
    { bookings: bookingsQuery() },
    { pageView: 'ACCOUNT_SECTION_OPENED' },
  );

  if (status === 'loading') return <ResultListSkeleton count={3} />;
  if (status === 'error') return <FailurePanel message="We couldn't load your trips." onRetry={retry} />;

  /* `eager`, because this list is the first thing under the summary card and
     is on screen the moment it loads — a plain Reveal would decide it had
     already been seen and leave it alone. It is also the one list on the page
     that appears *after* the page did, so there is nothing to interrupt: the
     rows replace a skeleton the reader has been watching, and coming in one
     after another is what says the wait is over. */
  return (
    <Stack gap={3}>
      <Reveal eager stagger direction="up" distance="sm" speed="fast">
        {data.bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
      </Reveal>
    </Stack>
  );
};
