/* ============================================================================
   FLIGHT SEARCH  ·  region
   The whole cost of adding a vertical. Everything imported here already
   existed except FlightResultCard and flightSearchQuery.
   ========================================================================= */

import { useMemo } from 'react';

import { Swap } from '../components/primitives';
import { Container, SearchLayout as DefaultSearchLayout } from '../components/layouts';
import {
  BusinessModelFilter, FailurePanel, FlightResultCard as DefaultFlightResultCard,
  ResultListSkeleton, SearchToolbar,
} from '../components/presenters';
import type { BusinessModelId, Flight, SearchCriteria, SortOption } from '../data/model';
import { api } from '../data/mock/api';
import { cache } from '../data/cache';
import { businessModelsQuery, flightSearchQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { payingWith } from '../domain';
import { useToast } from '../app/useToast';
import { useRouter } from '../app/router';
import { useBrand } from '../app/brand';

/* Flights sort differently. That is the difference, and it is data. */
const SORT: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'duration', label: 'Shortest' },
  { value: 'departure', label: 'Earliest departure' },
];

export const FlightSearchRegion = ({ destination, sort: sortParam, pay }: {
  destination: string;
  sort?: SortOption;
  pay?: BusinessModelId;
}) => {
  const brand = useBrand();
  const { showFailure } = useToast();
  const router = useRouter();

  // The brand may lay this page out its own way; most do not.
  const SearchLayout = brand.overrides?.search?.Layout ?? DefaultSearchLayout;
  const FlightResultCard = brand.overrides?.verticals?.air?.ResultCard ?? DefaultFlightResultCard;

  /* Sort and payment choice live in the URL, so the page can be shared and the
     back button undoes a filter. Both arrive as strings a user could have
     typed, so both are checked here — this region is the only place that
     knows which sorts and which ways to pay are real for this vertical. */
  const sort = SORT.some((o) => o.value === sortParam) ? sortParam! : 'recommended';
  const businessModel = payingWith(brand, pay);

  /* Changing a filter is the same page seen differently, so it replaces the
     history entry instead of adding one. */
  const setSort = (next: SortOption) =>
    router.replace({ name: 'flights', destination, sort: next, pay: businessModel });
  const setBusinessModel = (next: BusinessModelId) =>
    router.replace({ name: 'flights', destination, sort, pay: next });

  /* Booking a flight puts the flight in the cart. It used to navigate straight
     to checkout and leave a stay sitting there, so every flight checked out as
     a hotel — and the details step asked a flight passenger for nothing an
     airline needs. The cart carries the vertical; the vertical decides what
     the traveller is asked for. */
  const bookFlight = async (flight: Flight) => {
    await api.updateCart({
      vertical: 'air',
      businessModel,
      itemName: `${flight.originCode} → ${flight.destinationCode}`,
      itemDetail: `${flight.carrier} ${flight.flightNumber} · ${flight.cabin}`,
      prices: flight.prices,
      // A different booking is a different traveller. Do not inherit a name.
      contact: undefined,
      certificateId: undefined,
    });
    cache.invalidateTag('cart');
    router.go({ name: 'checkout' });
  };

  const criteria = useMemo<SearchCriteria>(
    () => ({ destination, checkIn: '2026-11-04', nights: 4, guests: 2, businessModel, sort }),
    [destination, businessModel, sort],
  );

  const { data, status, retry } = useLoad(
    {
      /* Availability arrives in pieces. One line says when it is
         finished; the interval, the deadline and the teardown are the
         cache's problem, not this page's. */
      results: flightSearchQuery(criteria).until((r) => r.complete),
      // Which ways to pay this member actually has, for this vertical.
      models: businessModelsQuery(brand.businessModels),
    },
    { pageView: 'SEARCH_RESULTS_VIEWED', onFailure: showFailure },
  );

  return (
    <Container>
      <SearchLayout
        filters={
          <BusinessModelFilter
            vertical="air"
            Control={brand.overrides?.checkout?.PaymentChoice}
            // Falls back to the brand's list until the member's own arrives.
            available={data ? data.models : brand.businessModels}
            value={businessModel}
            onChange={setBusinessModel}
            track={{ change: 'SEARCH_BIZMODEL_CHANGED' }}
          />
        }
        toolbar={
          <SearchToolbar
            vertical="air"
            heading={
              /* Partial and ready both have rows; only one of them is still
                 filling, and saying so is the whole point of showing early. */
              data ? `${data.results.items.length} of ${data.results.total} flights${status === 'partial' ? ' — still searching…' : ''}`
              : status === 'error' ? 'No flights'
              : 'Searching…'
            }
            sort={sort}
            sortOptions={SORT}
            onSort={setSort}
            track={{ change: 'SEARCH_SORTED' }}
          />
        }
        results={
          /* Skeleton, failure and results are three states of one box, so the
             height moves between them instead of jumping.

             Keyed on the three states and NOT on `status`: partial and ready
             are the same box, still filling. Keying on status remounts every
             row the moment the search completes, which fires a second
             impression for rows the reader has been looking at all along. */
          <Swap name={status === 'loading' || status === 'error' ? status : 'results'}>{
            status === 'loading' ? <ResultListSkeleton /> :
            status === 'error'   ? <FailurePanel message="We couldn't load these results." onRetry={retry} severity="warning" /> :
            <>
            {data.results.items.map((flight, index) => (
              <FlightResultCard
                key={flight.id}
                onSelect={() => void bookFlight(flight)}
                flight={flight}
                businessModel={businessModel}
                position={index}
                listId="air-search"
                track={{
                  impression: 'PRODUCT_VIEWED',
                  select:     'PRODUCT_SELECTED',
                  expand:     'PRODUCT_EXPANDED',
                }}
              />
            ))}
            {/* What is still coming. The server told us how many there are, so
                this is the real number of rows left, not a guess — and it is a
                row-shaped wait rather than a spinner over rows we already
                have. */}
            {status === 'partial' && (
              <ResultListSkeleton count={Math.min(3, data.results.total - data.results.items.length)} />
            )}
            </>
          }</Swap>
        }
      />
    </Container>
  );
};
