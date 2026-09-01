/* ============================================================================
   SKELETONS
   Built from spacing/surface tokens, so each brand's loading state already
   matches its density, corner radius and elevation. No per-brand code.
   ========================================================================= */

import { Card, Skeleton, SkeletonLines, Stack, Surface } from '../../primitives';
import { Container, Grid } from '../../layouts';
import styles from './skeletons.module.css';

export const ResultListSkeleton = ({ count = 4 }: { count?: number }) => (
  <Stack gap={4}>
    {Array.from({ length: count }, (_, i) => (
      <Card key={i}>
        <div className={styles.resultRow}>
          <Skeleton height={9} />
          <Stack gap={3}>
            <Skeleton shape="text" height={2} width="40%" />
            <Skeleton shape="text" height={4} width="70%" />
            <SkeletonLines lines={2} />
          </Stack>
          <Stack gap={2} align="end"><Skeleton shape="text" height={5} width="80px" /></Stack>
        </div>
      </Card>
    ))}
  </Stack>
);

export const CardGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <Grid>
    {Array.from({ length: count }, (_, i) => (
      <Card key={i}>
        <Skeleton height={9} />
        <div className={styles.cardBody}><SkeletonLines lines={2} /></div>
      </Card>
    ))}
  </Grid>
);

export const LandingSkeleton = () => (
  <Stack gap={7}>
    <Skeleton height={9} />
    <Container><CardGridSkeleton count={4} /></Container>
  </Stack>
);

export const AccountSkeleton = () => (
  <Container>
    <Stack gap={6}>
      <Surface tone="sunken" pad="lg" radius="lg"><SkeletonLines lines={3} /></Surface>
      <Stack gap={3}>
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} padded><SkeletonLines lines={2} /></Card>
        ))}
      </Stack>
    </Stack>
  </Container>
);
