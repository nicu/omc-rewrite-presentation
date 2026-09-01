/* ============================================================================
   STAY DETAILS  ·  region
   One property, and the rooms you can book in it.

   Two things about this page are worth reading the code for.

   The first is that it usually starts half-drawn. The row you clicked in the
   search results already carried the name, the picture, the rating and where
   the place is, so the list hands that row to the cache on the way out and
   this page finds it already there. It renders those facts on the first
   frame, while the real request — the one that brings the rooms and the
   long-form overview — is still in flight. The skeleton covers only the two
   things nobody could know yet. Nothing here has to co-ordinate that: the
   cache calls a seeded entry `partial`, which is the word it already had for
   "some of it, and more is coming", and useLoad hands a region its data in
   that state exactly as it does for a search that is still filling.

   The second is that everything this page is about arrives from the address
   bar. The id is a string somebody can type, and so is the way of paying. The
   region checks both against what actually exists — the router does not,
   because the router cannot: whether `h-nope` is a property is a question
   about data.
   ========================================================================= */

import { Container, HeroLayout, ListItemLayout, SearchLayout as DefaultSearchLayout } from '../components/layouts';
import {
  BusinessModelFilter, FailurePanel, PriceDisplay, Rating, ResultListSkeleton,
} from '../components/presenters';
import {
  Badge, Button, Skeleton, SkeletonLines, Stack, Surface, Swap, Text,
} from '../components/primitives';
import type { ProductListPayload } from '../telemetry/catalog';
import { useTracking, type TrackMap } from '../telemetry/tracking';
import type { BusinessModelId, Room } from '../data/model';
import { api } from '../data/mock/api';
import { cache } from '../data/cache';
import { businessModelsQuery, hotelQuery } from '../data/queries';
import { useLoad } from '../data/useLoad';
import { failureMessage } from '../errors/messages';
import { payingWith } from '../domain';
import { useToast } from '../app/useToast';
import { useRouter } from '../app/router';
import { useBrand } from '../app/brand';

export const HotelDetailsRegion = ({ id, pay }: { id: string; pay?: BusinessModelId }) => {
  const brand = useBrand();
  const router = useRouter();
  const { showFailure } = useToast();

  /* A details page is a search page with one result and no sorting, so it is
     the same arrangement — and a brand that rearranges its search pages has
     rearranged this one too, without being asked twice. */
  const SearchLayout = brand.overrides?.search?.Layout ?? DefaultSearchLayout;

  /* The way of paying comes off the URL, so it is checked against what this
     brand sells before anything is priced with it. Same call the search page
     makes, for the same reason. */
  const businessModel = payingWith(brand, pay);

  /* Choosing a different way to pay is this page seen differently, not a new
     place, so it replaces the history entry. */
  const setBusinessModel = (next: BusinessModelId) =>
    router.replace({ name: 'stay', id, pay: next });

  const { data, status, error, retry } = useLoad(
    {
      hotel: hotelQuery(id),
      models: businessModelsQuery(brand.businessModels),
    },
    { pageView: 'PRODUCT_VIEWED', onFailure: showFailure },
  );

  if (status === 'loading') return <DetailsSkeleton />;
  if (status === 'error') {
    return (
      <Container>
        <FailurePanel surface="page" message={failureMessage(error)} onRetry={retry} />
      </Container>
    );
  }

  const hotel = data.hotel;

  /* An id that is not a property. It arrives here as an absence rather than
     as a failure, because that is what it is: the request worked and the
     answer is that there is no such stay. So this is a page, not an error —
     no retry button, and a way onwards instead. */
  if (!hotel) return <NotFound onBrowse={() => router.go({ name: 'search', destination: '' })} />;

  /* Booking a room puts that room in the cart, and records how the reader
     chose to pay. The checkout has no other way to learn it: the choice is
     made here, on the way in, and a cart that does not carry it falls back to
     the brand's default — which is how somebody who asked to pay in full was
     still being asked about certificates. */
  const bookRoom = async (room: Room) => {
    await api.updateCart({
      vertical: 'hotel',
      businessModel,
      itemName: hotel.name,
      itemDetail: room.name,
      prices: room.prices,
      certificateId: undefined,
    });
    cache.invalidateTag('cart');
    router.go({ name: 'checkout' });
  };

  return (
    <>
      {/* Everything in here came off the search row, so on the way in from a
          list it is on screen before the request for this page has answered. */}
      <HeroLayout
        image={hotel.image}
        copy={
          <>
            <Text variant="overline" tone="onMedia">{hotel.destination}, {hotel.country}</Text>
            <Text variant="displayMd" tone="onMedia">{hotel.name}</Text>
          </>
        }
      />

      <Container>
        <SearchLayout
          banner={
            <Stack gap={4}>
              <Stack direction="horizontal" gap={4} align="center" wrap>
                <Rating score={hotel.rating} reviewCount={hotel.reviewCount} emphasis="mark" />
                {hotel.badge && <Badge tone="brand">{hotel.badge}</Badge>}
              </Stack>

              <Stack direction="horizontal" gap={2} wrap>
                {hotel.amenities.map((amenity) => <Badge key={amenity}>{amenity}</Badge>)}
              </Stack>

              {/* The line above was in the list; the paragraphs below were not.
                  They sit next to each other so that what this page knows and
                  what it is still waiting for are visible at the same time. */}
              <Text variant="body">{hotel.description}</Text>
              {hotel.overview
                ? <Text variant="body" tone="secondary">{hotel.overview}</Text>
                : <SkeletonLines lines={3} />}
            </Stack>
          }
          filters={
            <BusinessModelFilter
              vertical="hotel"
              Control={brand.overrides?.checkout?.PaymentChoice}
              available={data.models}
              value={businessModel}
              onChange={setBusinessModel}
              track={{ change: 'SEARCH_BIZMODEL_CHANGED' }}
            />
          }
          toolbar={
            <Text variant="heading">
              {hotel.rooms ? `${hotel.rooms.length} room types` : 'Rooms'}
            </Text>
          }
          results={
            /* The rooms are the half of this page a search row could never
               carry, so they are the half that waits. */
            <Swap name={hotel.rooms ? 'rooms' : 'waiting'}>{
              hotel.rooms
                ? hotel.rooms.map((room, index) => (
                    <RoomRow
                      key={room.id}
                      room={room}
                      businessModel={businessModel}
                      position={index}
                      listId={`hotel-rooms:${hotel.id}`}
                      onBook={bookRoom}
                      track={{ select: 'PRODUCT_SELECTED' }}
                    />
                  ))
                : <ResultListSkeleton count={3} />
            }</Swap>
          }
        />
      </Container>
    </>
  );
};

/* --- a room row ----------------------------------------------------------
   A presenter by every rule that matters: props in, markup out, no fetch, no
   router, and it offers an action rather than naming one. It lives in this
   file because exactly one page draws a room. The day a second one does it
   moves to src/components/presenters/search/ unchanged — which is the test of
   whether it was written as a presenter or as a piece of this page. */

type RoomActions = { select: ProductListPayload };

const RoomRow = ({ room, businessModel, onBook, track, position, listId }: {
  room: Room;
  businessModel: BusinessModelId;
  onBook?: (room: Room) => void;
  track?: TrackMap<RoomActions>;
  position?: number;
  listId?: string;
}) => {
  const price = room.prices[businessModel];

  const t = useTracking<RoomActions, { select: () => ProductListPayload }>(track, {
    select: () => ({ productId: room.id, productName: room.name, position, listId }),
  });

  return (
    <ListItemLayout
      ariaLabel={room.name}
      body={
        <Stack gap={2}>
          <Text variant="title">{room.name}</Text>
          <Text variant="caption" tone="secondary">{room.description}</Text>
        </Stack>
      }
      aside={
        <Stack gap={3} align="stretch">
          {price
            ? <PriceDisplay price={price} />
            : <Text variant="caption" tone="muted">Not available on this rate</Text>}
          <Button
            size="sm"
            block
            disabled={!price}
            onClick={() => { t.select(); onBook?.(room); }}
          >
            Book this room
          </Button>
        </Stack>
      }
    />
  );
};

/* --- the two states that are not the page -------------------------------- */

/** Nothing was handed over, so nothing is known yet — a cold link rather than
 *  an arrival from a list. This is the only path on which the name and the
 *  picture are covered up, because it is the only one where they are unknown. */
const DetailsSkeleton = () => (
  <Stack gap={7}>
    <Skeleton height={9} />
    <Container>
      <Stack gap={6}>
        <SkeletonLines lines={3} />
        <ResultListSkeleton count={3} />
      </Stack>
    </Container>
  </Stack>
);

const NotFound = ({ onBrowse }: { onBrowse: () => void }) => (
  <Container width="narrow">
    <Surface tone="sunken" pad="lg" radius="lg">
      <Stack gap={4} align="center">
        <Text variant="heading">We couldn&rsquo;t find that stay</Text>
        <Text variant="body" tone="secondary">
          The link may be out of date, or the property may no longer be sold here.
        </Text>
        <Button variant="secondary" onClick={onBrowse}>See all stays</Button>
      </Stack>
    </Surface>
  </Container>
);
