/* ============================================================================
   HOTEL LANDING  ·  region
   Three resources, one boundary, one guard. The region names itself once
   ("hotel.landing") and that name becomes the telemetry region for every
   event emitted below it — including the load failure, which is reported
   automatically without a single trackEvent call here.
   ========================================================================= */

import { Button, Stack, Text } from "../components/atoms";
import { Container, Grid, HeroLayout, Section } from "../components/layouts";
import {
  DestinationCard,
  FailurePanel,
  HotelResultCard,
  LandingSkeleton,
  PromoBanner,
  SearchBar,
} from "../components/presenters";
import {
  destinationsQuery,
  featuredHotelsQuery,
  promosQuery,
} from "../data/queries";
import { useLoad } from "../data/useLoad";
import { failureMessage } from "../errors/messages";
import { useTenant } from "../app/tenant";
import { hasLoyalty } from "../brands";
import { useRouter } from "../app/router";

export const HotelLandingRegion = () => {
  const tenant = useTenant();
  const router = useRouter();

  const { data, status, error, retry, Scope } = useLoad(
    {
      destinations: destinationsQuery(),
      promos: promosQuery(),
      featured: featuredHotelsQuery(),
    },
    { name: "hotel.landing", pageView: "LANDING_VIEWED" },
  );

  if (status === "loading") return <LandingSkeleton />;

  if (status === "error") {
    return (
      <Container>
        <FailurePanel
          surface="page"
          message={failureMessage(error)}
          onRetry={retry}
        />
      </Container>
    );
  }

  return (
    <Scope>
      <HeroLayout
        image={tenant.heroImage}
        copy={
          <>
            <Text variant="displayLg" tone="onMedia">
              {tenant.tagline}
            </Text>
            <Text variant="body" tone="onMedia">
              {data.destinations.reduce((n, d) => n + d.propertyCount, 0)}{" "}
              properties across {data.destinations.length} destinations.
            </Text>
          </>
        }
        search={
          <SearchBar
            vertical="hotel"
            track={{ submit: "SEARCH_PERFORMED" }}
            onSearch={(destination) =>
              router.go({ name: "search", destination })
            }
          />
        }
      />

      <Container>
        <Section title={<Text variant="heading">Where members are going</Text>}>
          <Grid columns={4}>
            {data.destinations.slice(0, 4).map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                vertical="hotel"
                track={{ select: "DESTINATION_SELECTED" }}
                onSelect={(d) =>
                  router.go({ name: "search", destination: d.name })
                }
              />
            ))}
          </Grid>
        </Section>

        <Section>
          <Stack gap={5}>
            {data.promos.map((promo, index) => (
              <PromoBanner
                key={promo.id}
                promo={promo}
                position={index}
                eyebrow={hasLoyalty(tenant) ? "Member offer" : "Limited offer"}
                track={{ impression: "PROMO_VIEWED", select: "PROMO_SELECTED" }}
                onSelect={() => router.go({ name: "search", destination: "" })}
              />
            ))}
          </Stack>
        </Section>

        <Section
          title={<Text variant="heading">Featured stays</Text>}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.go({ name: "search", destination: "" })}
            >
              See all
            </Button>
          }
        >
          <Stack gap={4}>
            {data.featured.map((hotel, index) => (
              <HotelResultCard
                key={hotel.id}
                hotel={hotel}
                businessModel={tenant.defaultBusinessModel}
                position={index}
                listId="landing-featured"
                /* Only impressions and clicks matter here — the same card runs
                   fully instrumented on search and uninstrumented on account. */
                track={{
                  impression: "PRODUCT_VIEWED",
                  select: "PRODUCT_SELECTED",
                }}
                onSelect={() =>
                  router.go({ name: "search", destination: hotel.destination })
                }
              />
            ))}
          </Stack>
        </Section>
      </Container>
    </Scope>
  );
};
