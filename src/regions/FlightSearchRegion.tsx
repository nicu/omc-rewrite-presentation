/* ============================================================================
   FLIGHT SEARCH  ·  region
   The whole cost of adding a vertical. Everything imported here already
   existed except FlightResultCard and flightSearchQuery.
   ========================================================================= */

import { useMemo, useState } from 'react';

import { Container, SearchLayout } from '../components/layouts';
import {
  BusinessModelFilter, FailurePanel, FlightResultCard, ResultListSkeleton, SearchToolbar,
} from '../components/presenters';
import type { BusinessModelId, SearchCriteria, SortOption } from '../data/model';
import { businessModelsQuery, flightSearchQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { useToast } from '../app/useToast';
import { useTenant } from '../app/tenant';

/* Flights sort differently. That is the difference, and it is data. */
const SORT: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'duration', label: 'Shortest' },
  { value: 'departure', label: 'Earliest departure' },
];

export const FlightSearchRegion = ({ destination }: { destination: string }) => {
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
      results: flightSearchQuery(criteria),
      // Which ways to pay this member actually has, for this vertical.
      models: businessModelsQuery(tenant.businessModels),
    },
    { name: 'air.search', pageView: 'SEARCH_RESULTS_VIEWED', onFailure: showFailure },
  );

  return (
    <Scope>
      <Container>
        <SearchLayout
          filters={
            <BusinessModelFilter
              vertical="air"
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
              vertical="air"
              heading={
                status === 'ready' ? `${data.results.length} flights`
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
            status === 'loading' ? <ResultListSkeleton /> :
            status === 'error'   ? <FailurePanel message="We couldn't load these results." onRetry={retry} severity="warning" /> :
            data.results.map((flight, index) => (
              <FlightResultCard
                key={flight.id}
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
            ))
          }
        />
      </Container>
    </Scope>
  );
};
