import MuiSkeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import type { Space } from './Stack';

export const Skeleton = ({ height = 4, width = '100%', shape = 'block' }: {
  height?: Space; width?: string; shape?: 'block' | 'text';
}) => (
  <MuiSkeleton
    variant={shape === 'text' ? 'text' : 'rounded'}
    width={width}
    height={shape === 'text' ? undefined : `var(--space-${height})`}
  />
);

export const SkeletonLines = ({ lines = 3 }: { lines?: number }) => (
  <Stack spacing={0.5}>
    {Array.from({ length: lines }, (_, i) => (
      <MuiSkeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </Stack>
);
