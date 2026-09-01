import type { ComponentType } from 'react';

/* ============================================================================
   SEARCH CONTROLS  ·  presenters shared by every vertical
   Extracted when the flights vertical arrived and wanted exactly the same
   two controls as hotels. Neither knows what is being searched for.
   ========================================================================= */

import { SegmentedChoice, SelectChoice, Stack, Surface, Text, type ChoiceOption, type ChoiceProps } from '../atoms';
import { useTracking, type TrackMap } from '../../telemetry/tracking';
import type { BusinessModelPayload, SearchRefinePayload } from '../../telemetry/catalog';
import { BUSINESS_MODELS, type BusinessModelId, type SortOption } from '../../data/model';

/* --- how you pay -------------------------------------------------------- */

type ModelActions = { change: BusinessModelPayload };

export const BusinessModelFilter = ({
  vertical, available, value, onChange, Control = SegmentedChoice, track,
}: {
    vertical: string;
  available: BusinessModelId[];
  value: BusinessModelId;
  onChange: (next: BusinessModelId) => void;
  /** The control the brand chose. Defaults to buttons when it chose nothing. */
  Control?: ComponentType<ChoiceProps<BusinessModelId>>;
  track?: TrackMap<ModelActions>;
}) => {
  const t = useTracking<ModelActions, { change: (next: BusinessModelId) => BusinessModelPayload }>(track, {
    change: (next) => ({ vertical, from: value, to: next }),
  });

  return (
    <Surface tone="raised" pad="md" radius="lg" bordered>
      <Stack gap={4}>
        <Text variant="overline" tone="muted">How you want to pay</Text>
                <Control
          ariaLabel="How you want to pay"
          value={value}
          options={available.map((id) => ({ value: id, label: BUSINESS_MODELS[id].label }))}
          onChange={(next: BusinessModelId) => { t.change(next); onChange(next); }}
        />
        <Text variant="caption" tone="secondary">{BUSINESS_MODELS[value].tagline}</Text>
      </Stack>
    </Surface>
  );
};

/* --- result count and sort ---------------------------------------------- */

type SortActions = { change: SearchRefinePayload };

export const SearchToolbar = ({
  vertical, heading, sort, sortOptions, onSort, track,
}: {
  vertical: string;
  /** e.g. "6 stays in Los Cabos" or "5 flights to Cancún" — the region words it. */
  heading: string;
  sort: SortOption;
  sortOptions: ChoiceOption<SortOption>[];
  onSort: (next: SortOption) => void;
  track?: TrackMap<SortActions>;
}) => {
  const t = useTracking<SortActions, { change: (next: SortOption) => SearchRefinePayload }>(track, {
    change: (next) => ({ vertical, value: next }),
  });

  return (
    <>
      <Text variant="title">{heading}</Text>
            <SelectChoice
        ariaLabel="Sort results"
        value={sort}
        options={sortOptions}
        onChange={(next: SortOption) => { t.change(next); onSort(next); }}
      />
    </>
  );
};
