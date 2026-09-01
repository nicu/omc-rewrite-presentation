/* ============================================================================
   HOTEL LANDING  ·  region
   It loads three things and renders a list of sections. Which sections, and in
   what order, is the brand's — the same arrangement the checkout uses for its
   steps, and for the same reason: a page was a fixed run of JSX, so a brand
   that wanted a different one had to fork the whole region.

   This file has no idea what any section contains.
   ========================================================================= */

import { Container } from '../components/layouts';
import type { LandingSection } from './landing/sections';
import { FailurePanel, LandingSkeleton } from '../components/presenters';
import { destinationsQuery, featuredHotelsQuery, landingLayoutQuery, promosQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { failureMessage } from '../errors/messages';
import { useBrand } from '../app/brand';
import { useRouter } from '../app/router';
import { LANDING, SECTIONS } from './landing/sections';

export const HotelLandingRegion = () => {
  const brand = useBrand();
  const router = useRouter();

  /* A brand whose running order lives in the content system fetches it with
     everything else — one call, still parallel, and no second status to
     guard. A brand whose order is in config never issues the request. */
  const fromCms = brand.landing === 'cms';

  const { data, status, error, retry } = useLoad(
    {
      destinations: destinationsQuery(),
      /* A missing offers strip is a worse page, not a broken one. Marked
         optional, its failure leaves `data.promos` undefined and the rest
         of the landing page arrives as usual. */
      promos: promosQuery().optional(),
      featured: featuredHotelsQuery(),
      ...(fromCms ? { layout: landingLayoutQuery(brand.id) } : {}),
    },
    { pageView: 'LANDING_VIEWED' },
  );

  if (status === 'loading') return <LandingSkeleton />;

  if (status === 'error') {
    return (
      <Container>
        <FailurePanel surface="page" message={failureMessage(error)} onRetry={retry} />
      </Container>
    );
  }

  /* Three sources, one shape. Config, the content system, or the shared
     default — the loop below cannot tell which answered, which is the whole
     argument: a page that is a list does not care where the list came from.

     Ids the CMS names but we do not have are dropped rather than thrown on:
     content can mention a block that was removed, and a page missing a section
     is better than a page that will not render. */
  /* The query set is conditional, so its result is too. One narrow read
     rather than a cast at every use. */
  const layout = (data as { layout?: string[] }).layout;

  const sections: LandingSection[] = layout
    ? layout.filter((id) => id in SECTIONS).map((id) => ({ id, Section: SECTIONS[id] }))
    : Array.isArray(brand.landing) ? brand.landing : LANDING;
  const onSearch = (destination: string) => router.go({ name: 'search', destination });

  return (
    <>
      {sections.map(({ id, Section }) => (
        <Section key={id} data={data} onSearch={onSearch} />
      ))}
    </>
  );
};
