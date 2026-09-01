/* ============================================================================
   KIOSK · its own landing page
   Four sections in a magazine app's order: the search line first, then a shelf
   of covers you scroll sideways, then the categories as discs, then the issues
   in a list.

   As with Folio, none of this is a new card or a new price display. The shelf
   is the shared DestinationCard on a horizontal grid; the issues are the shared
   HotelResultCard. Only the shelves belong to Kiosk.
   ========================================================================= */

import { Entrance, Reveal, RevealGroup, Stack, Text } from '../../../components/primitives';
import { Container, Section } from '../../../components/layouts';
import { SearchBar } from '../../../components/presenters';
import { DestinationCard } from './DestinationCard';
import { HotelResultCard } from './HotelResultCard';
import type { LandingSection, LandingSectionProps } from '../../../regions/landing/sections';
import { useBrand } from '../../../app/brand';
import styles from './Landing.module.css';

const Masthead = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <Container>
      <div className={styles.masthead}>
        <Stack gap={5}>
          <Entrance direction="up" distance="md" speed="normal" order={0}>
            <Text variant="displayMd">{brand.tagline}</Text>
          </Entrance>
          <Entrance direction="up" distance="sm" speed="normal" order={1}>
            <div className={styles.searchLine}>
              <SearchBar vertical="hotel" track={{ submit: 'SEARCH_PERFORMED' }} onSearch={onSearch} />
            </div>
          </Entrance>
          <Entrance direction="fade" speed="slow" order={2}>
            <Text variant="caption" tone="muted">
              {data.destinations.length} destinations &middot;{' '}
              {data.destinations.reduce((n, d) => n + d.propertyCount, 0)} rooms &middot; restocked Friday
            </Text>
          </Entrance>
        </Stack>
      </div>
    </Container>
  );
};

/** The shelf. Same card as everyone else's, laid out to run off the edge. */
const Shelf = ({ data, onSearch }: LandingSectionProps) => (
  <Container>
    <Section title={<Text variant="heading">Popular</Text>}>
      <div className={styles.shelf}>
        {data.destinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            vertical="hotel"
            onSelect={(d) => onSearch(d.name)}
            track={{ select: 'DESTINATION_SELECTED' }}
          />
        ))}
      </div>
    </Section>
  </Container>
);

/* The shelf's categories. Editorial copy, so it lives with the brand that
   writes it — the same place Folio keeps "Issue Eleven". */
const CATEGORIES = [
  'Beachfront', 'City breaks', 'Islands', 'Ski', 'Spa & wellness',
  'Food & wine', 'Design hotels', 'Family', 'Adults only', 'Last minute',
];

const Categories = ({ data, onSearch }: LandingSectionProps) => (
  <Container>
    <Section title={<Text variant="heading">Category</Text>}>
      {/* One trigger for the row, so they arrive as a sequence from the right
          rather than ten separate observations firing at their own moments. */}
      <RevealGroup>
        <div className={styles.categories}>
          {CATEGORIES.map((label, i) => (
            <Reveal key={label} direction="left" distance="lg" speed="normal" order={i}>
              <button
                type="button"
                className={styles.category}
                onClick={() => onSearch(data.destinations[i % data.destinations.length].name)}
              >
                <span className={styles.disc}>
                  <img src={data.destinations[i % data.destinations.length].image} alt="" />
                </span>
                <Text variant="caption">{label}</Text>
              </button>
            </Reveal>
          ))}
        </div>
      </RevealGroup>
    </Section>
  </Container>
);

const Issues = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <Container>
      <Section title={<Text variant="heading">Current issues</Text>}>
        <div className={styles.issues}>
          <Reveal stagger direction="up" distance="md">
            {data.featured.map((hotel, index) => (
              <HotelResultCard
                key={hotel.id}
                hotel={hotel}
                businessModel={brand.defaultBusinessModel}
                position={index}
                listId="kiosk-issues"
                track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED' }}
                onSelect={() => onSearch(hotel.destination)}
              />
            ))}
          </Reveal>
        </div>
      </Section>
    </Container>
  );
};

export const KIOSK_LANDING: LandingSection[] = [
  { id: 'masthead', Section: Masthead },
  { id: 'shelf', Section: Shelf },
  { id: 'categories', Section: Categories },
  { id: 'issues', Section: Issues },
];
