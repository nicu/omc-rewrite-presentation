/* ============================================================================
   HOTEL SEARCH  ·  region
   Compare this file directly against FlightSearchRegion.tsx. The two were
   written independently and ended up almost identical, which is the point:
   the shape of a search page is shared, only the card differs.
   ========================================================================= */

import { useMemo, useState } from 'react';

import { Container, SearchLayout } from '../components/layouts';
import {
  BusinessModelFilter, FailurePanel, HotelResultCard, ResultListSkeleton, SearchToolbar,
} from '../components/presenters';
import type { BusinessModelId, SearchCriteria, SortOption } from '../data/model';
import { businessModelsQuery, hotelSearchQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { useToast } from '../app/useToast';
import { useTenant } from '../app/tenant';

const SORT: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'rating', label: 'Guest rating' },
];

export const HotelSearchRegion = ({ destination }: { destination: string }) => {
  const tenant = useTenant();
  const { showFailure } = useToast();

  const [businessModel, setBusinessModel] = useState<BusinessModelId>(tenant.defaultBusinessModel);
  const [sort, setSort] = useState<SortOption>('recommended');

  const criteria = useMemo<SearchCriteria>(
    () => ({ destination, checkIn: '2026-11-04', nights: 4, guests: 2, businessModel, sort }),
    [destination, businessModel, sort],
  );

  const { data, status, retry, Scope } = useLoad(
    {
      results: hotelSearchQuery(criteria),
      // Which ways to pay this member actually has, for this vertical.
      models: businessModelsQuery(tenant.businessModels),
    },
    { name: 'hotel.search', pageView: 'SEARCH_RESULTS_VIEWED', onFailure: showFailure },
  );

  return (
    <Scope>
      <Container>
        <SearchLayout
          filters={
            <BusinessModelFilter
              vertical="hotel"
              Control={tenant.overrides?.PaymentChoice}
              // Falls back to the brand's list until the member's own arrives.
              available={status === 'ready' ? data.models : tenant.businessModels}
              value={businessModel}
              onChange={setBusinessModel}
              track={{ change: 'SEARCH_BIZMODEL_CHANGED' }}
            />
          }
          toolbar={
            <SearchToolbar
              vertical="hotel"
              heading={
                status === 'ready' ? `${data.results.length} stays${destination ? ` in ${destination}` : ''}`
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
            status === 'loading' ? <ResultListSkeleton /> :
            status === 'error'   ? <FailurePanel message="We couldn't load these results." onRetry={retry} severity="warning" /> :
            data.results.map((hotel, index) => (
              <HotelResultCard
                key={hotel.id}
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
            ))
          }
        />
      </Container>
    </Scope>
  );
};
