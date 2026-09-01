/* ============================================================================
   HOTEL SEARCH  ·  region
   Compare this file directly against FlightSearchRegion.tsx. The two were
   written independently and ended up almost identical, which is the point:
   the shape of a search page is shared, only the card differs.
   ========================================================================= */

import { useMemo } from 'react';

import { Swap } from '../components/primitives';
import { Container, SearchLayout as DefaultSearchLayout } from '../components/layouts';
import {
  BusinessModelFilter, FailurePanel, HotelResultCard as DefaultHotelResultCard,
  ResultListSkeleton, SearchToolbar,
} from '../components/presenters';
import type { BusinessModelId, Hotel, SearchCriteria, SortOption } from '../data/model';
import { cache } from '../data/cache';
import { businessModelsQuery, hotelQuery, hotelSearchQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { payingWith } from '../domain';
import { useToast } from '../app/useToast';
import { useRouter } from '../app/router';
import { useBrand } from '../app/brand';

const SORT: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'rating', label: 'Guest rating' },
];

export const HotelSearchRegion = ({ destination, sort: sortParam, pay }: {
  destination: string;
  sort?: SortOption;
  pay?: BusinessModelId;
}) => {
  const brand = useBrand();
  const { showFailure } = useToast();
  const router = useRouter();

  // The brand may lay this page out its own way; most do not.
  const SearchLayout = brand.overrides?.search?.Layout ?? DefaultSearchLayout;
  const HotelResultCard = brand.overrides?.verticals?.hotel?.ResultCard ?? DefaultHotelResultCard;

  /* Sort and payment choice live in the URL, so the page can be shared and the
     back button undoes a filter. Both arrive as strings a user could have
     typed, so both are checked here — this region is the only place that
     knows which sorts and which ways to pay are real for this vertical. */
  const sort = SORT.some((o) => o.value === sortParam) ? sortParam! : 'recommended';
  const businessModel = payingWith(brand, pay);

  /* Changing a filter is the same page seen differently, so it replaces the
     history entry instead of adding one. */
  const setSort = (next: SortOption) =>
    router.replace({ name: 'search', destination, sort: next, pay: businessModel });
  const setBusinessModel = (next: BusinessModelId) =>
    router.replace({ name: 'search', destination, sort, pay: next });

  /* Opening a stay. The row already on the screen carries most of what the
     next page draws — the name, the picture, the rating, the destination — so
     it goes into the cache under the key that page will look under, and the
     details page starts half-drawn instead of behind a skeleton. The real
     request still runs and still wins; this only decides what is on screen
     while it does.

     It is done here, at the moment of navigating, rather than for every row
     on render: seeding six entries to use one of them is work spent on the
     five nobody asked for. */
  const openStay = (hotel: Hotel) => {
    cache.seed(hotelQuery(hotel.id), hotel);
    router.go({ name: 'stay', id: hotel.id, pay: businessModel });
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
      results: hotelSearchQuery(criteria).until((r) => r.complete),
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
            vertical="hotel"
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
            vertical="hotel"
            heading={
              /* Partial and ready both have rows; only one of them is still
                 filling, and saying so is the whole point of showing early. */
              data ? `${data.results.items.length} of ${data.results.total} stays${status === 'partial' ? ' — still searching…' : ''}`
              : status === 'error' ? 'No stays'
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

             Keyed on those three and NOT on `status`: partial and ready are the
             same box, still filling. Keying on status remounts every row the
             moment the search completes, which fires a second impression for
             rows the reader has been looking at all along. */
          <Swap name={status === 'loading' || status === 'error' ? status : 'results'}>{
            status === 'loading' ? <ResultListSkeleton /> :
            status === 'error'   ? <FailurePanel message="We couldn't load these results." onRetry={retry} severity="warning" /> :
            <>
            {data.results.items.map((hotel, index) => (
              <HotelResultCard
                key={hotel.id}
                onSelect={openStay}
                hotel={hotel}
                businessModel={businessModel}
                position={index}
                listId={`hotel-search:${destination || 'all'}`}
                track={{
                  impression:    'PRODUCT_VIEWED',
                  select:        'PRODUCT_SELECTED',
                  moreLoaded:    'PRODUCT_CONTENT_SCROLLED',
                  infoRequested: 'PRODUCT_INFO_REQUESTED',
                  expand:        'PRODUCT_EXPANDED',
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
