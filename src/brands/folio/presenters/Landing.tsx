/* ============================================================================
   FOLIO · its own landing page
   Four sections, in a different order from everyone else's, laid out like a
   printed spread: the masthead runs the type over a plate that breaks off the
   right edge, the index is deliberately off the grid, and the featured stays
   are a numbered editorial run rather than a stack of cards.

   What is worth noticing is what is *not* here. No new card, no new price
   display, no new rating, no fetching, no tracking of its own. Every piece
   inside these sections is the shared one; only the arrangement is Folio's.
   ========================================================================= */

import { Entrance, Reveal, Stack, Text } from '../../../components/primitives';
import { Container, Section } from '../../../components/layouts';
import { DestinationCard, HotelResultCard, SearchBar } from '../../../components/presenters';
import type { LandingSection, LandingSectionProps } from '../../../regions/landing/sections';
import { Promos } from '../../../regions/landing/sections';
import { useBrand } from '../../../app/brand';
import styles from './Landing.module.css';

const Masthead = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <Container>
      <div className={styles.masthead}>
        <div className={styles.issue}>
          Folio &middot; Issue Eleven &middot; {data.destinations.length} destinations,
          {' '}{data.destinations.reduce((n, d) => n + d.propertyCount, 0)} rooms
        </div>
        <div className={styles.mastheadInner}>
          <Stack gap={4}>
            <Entrance direction="up" distance="lg" speed="slow" order={0}>
              <Text variant="displayLg">{brand.tagline}</Text>
            </Entrance>
            <Entrance direction="up" distance="md" speed="slow" order={1}>
              <Text variant="body" tone="secondary">
                Every place on this list has been stayed in by someone who works here.
                There is no algorithm and there are no sponsored entries.
              </Text>
            </Entrance>
          </Stack>
          <Entrance direction="right" distance="lg" speed="slow" order={2}>
            <div className={styles.plate}>
              <img src={brand.heroImage} alt="" />
            </div>
          </Entrance>
        </div>
        <div className={styles.search}>
          <SearchBar vertical="hotel" track={{ submit: 'SEARCH_PERFORMED' }} onSearch={onSearch} />
        </div>
      </div>
    </Container>
  );
};

const Index = ({ data, onSearch }: LandingSectionProps) => (
  <Container>
    <Section title={<Text variant="heading">The index</Text>}>
      <div className={styles.index}>
        {data.destinations.slice(0, 4).map((destination, i) => (
          <div key={destination.id} className={styles.cell}>
            <Reveal direction={i % 2 ? 'right' : 'left'} distance="lg" speed="slow">
              <DestinationCard
                destination={destination}
                vertical="hotel"
                onSelect={(d) => onSearch(d.name)}
                track={{ select: 'DESTINATION_SELECTED' }}
              />
            </Reveal>
          </div>
        ))}
      </div>
    </Section>
  </Container>
);

const Run = ({ data, onSearch }: LandingSectionProps) => {
  const brand = useBrand();
  return (
    <Container>
      <Section title={<Text variant="heading">This issue</Text>}>
        <div className={styles.run}>
          {data.featured.map((hotel, index) => (
            <div key={hotel.id} className={styles.entry}>
              <div className={styles.number}>{String(index + 1).padStart(2, '0')}</div>
              <Reveal direction={index % 2 ? 'left' : 'right'} distance="lg" speed="slow">
                <HotelResultCard
                  hotel={hotel}
                  businessModel={brand.defaultBusinessModel}
                  position={index}
                  listId="folio-issue"
                  track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED' }}
                  onSelect={() => onSearch(hotel.destination)}
                />
              </Reveal>
            </div>
          ))}
        </div>
      </Section>
    </Container>
  );
};

/** A different page: the run comes before the index, and the promos last. */
export const FOLIO_LANDING: LandingSection[] = [
  { id: 'masthead', Section: Masthead },
  { id: 'run', Section: Run },
  { id: 'index', Section: Index },
  { id: 'promos', Section: Promos },
];
