/* ============================================================================
   THE LANDING PAGE  ·  a list of sections
   The same move the checkout made. A page was a fixed run of JSX, so the only
   way for a brand to reorder it, drop one, or add one of its own was to fork
   the region. Now it is a list, and a brand can hand back a different one.

   Each section is handed everything the page loaded and a way to navigate.
   None of them fetch, and none of them know which brand they are in.
   ========================================================================= */

import type { ComponentType } from 'react';

import { Reveal, Text } from '../../components/primitives';
import { Container, HeroLayout, Section } from '../../components/layouts';
import { DestinationGrid, HotelResultCard, PromoBanner, SearchBar } from '../../components/presenters';
import { Button, Stack } from '../../components/primitives';
import type { Destination, Hotel, Promo } from '../../data/model';
import { hasLoyalty } from '../../domain/membership';
import { useBrand } from '../../app/brand';

export type LandingData = {
  destinations: Destination[];
  /** Optional at the call site, so this is genuinely sometimes absent. */
  promos: Promo[] | undefined;
  featured: Hotel[];
};

export type LandingSectionProps = {
  data: LandingData;
  /** Where a search or a card click goes. The section never routes itself. */
  onSearch: (destination: string) => void;
};

export type LandingSection = {
  id: string;
  Section: ComponentType<LandingSectionProps>;
};

/* --- the shared sections ------------------------------------------------- */

export const Hero = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <HeroLayout
      image={brand.heroImage}
      copy={
        <>
          <Text variant="displayLg" tone="onMedia">{brand.tagline}</Text>
          <Text variant="body" tone="onMedia">
            {data.destinations.reduce((n, d) => n + d.propertyCount, 0)} properties
            across {data.destinations.length} destinations.
          </Text>
        </>
      }
      search={<SearchBar vertical="hotel" track={{ submit: 'SEARCH_PERFORMED' }} onSearch={onSearch} />}
    />
  );
};

export const Destinations = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  const FeaturedDestinations = brand.overrides?.landing?.FeaturedDestinations ?? DestinationGrid;
  return (
    <Container>
      <Section title={<Text variant="heading">Where members are going</Text>}>
        <FeaturedDestinations
          destinations={data.destinations.slice(0, 4)}
          onSelect={(d) => onSearch(d.name)}
          track={{ select: 'DESTINATION_SELECTED' }}
          Card={brand.overrides?.landing?.DestinationCard}
        />
      </Section>
    </Container>
  );
};

export const Promos = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  /* No offers is a section that is not there, not an empty box with a heading. */
  if (!data.promos?.length) return null;
  return (
    <Container>
      <Section>
        <Reveal direction="up" distance="md" speed="normal">
          <Stack gap={5}>
            {data.promos.map((promo, index) => (
              <PromoBanner
                key={promo.id}
                promo={promo}
                position={index}
                eyebrow={hasLoyalty(brand) ? 'Member offer' : 'Limited offer'}
                track={{ impression: 'PROMO_VIEWED', select: 'PROMO_SELECTED' }}
                onSelect={() => onSearch('')}
              />
            ))}
          </Stack>
        </Reveal>
      </Section>
    </Container>
  );
};

export const Featured = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <Container>
      <Section
        title={<Text variant="heading">Featured stays</Text>}
        action={<Button variant="ghost" size="sm" onClick={() => onSearch('')}>See all</Button>}
      >
        <Stack gap={4}>
          <Reveal stagger direction="up" distance="md">
            {data.featured.map((hotel, index) => (
              <HotelResultCard
                key={hotel.id}
                hotel={hotel}
                businessModel={brand.defaultBusinessModel}
                position={index}
                listId="landing-featured"
                /* Only impressions and clicks matter here. The same card
                   names all five on the search page. */
                track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED' }}
                onSelect={() => onSearch(hotel.destination)}
              />
            ))}
          </Reveal>
        </Stack>
      </Section>
    </Container>
  );
};

/**
 * Every section a content system is allowed to name. A CMS holds ids and an
 * order; it cannot hold components, so this is the vocabulary it writes
 * against. A brand's own sections are deliberately absent — a marketer can
 * reorder the shared page, not summon code that only one brand has.
 */
export const SECTIONS: Record<string, LandingSection['Section']> = {
  hero: Hero, destinations: Destinations, promos: Promos, featured: Featured,
};

/** What every brand gets unless it says otherwise. */
export const LANDING: LandingSection[] = [
  { id: 'hero', Section: Hero },
  { id: 'destinations', Section: Destinations },
  { id: 'promos', Section: Promos },
  { id: 'featured', Section: Featured },
];
