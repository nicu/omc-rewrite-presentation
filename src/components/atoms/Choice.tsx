/* ============================================================================
   THE THREE SHARED SHAPES
   One job — pick one of a few options — drawn three ways. A brand names the
   one it wants; it does not describe it with a keyword.
   ========================================================================= */

import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export type ChoiceOption<T extends string> = { value: T; label: string };

/** What every choice control receives. A brand can supply its own component
 *  as long as it takes these. */
export type ChoiceProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
};

export const SegmentedChoice = <T extends string>({ options, value, onChange, ariaLabel }: ChoiceProps<T>) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={value}
    aria-label={ariaLabel}
    onChange={(_, next) => next && onChange(next as T)}
    sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 1 }}
  >
    {options.map((o) => <ToggleButton key={o.value} value={o.value}>{o.label}</ToggleButton>)}
  </ToggleButtonGroup>
);

export const ChipChoice = <T extends string>({ options, value, onChange, ariaLabel }: ChoiceProps<T>) => (
  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} role="group" aria-label={ariaLabel}>
    {options.map((o) => (
      <Chip
        key={o.value}
        label={o.label}
        variant={o.value === value ? 'filled' : 'outlined'}
        color={o.value === value ? 'primary' : 'default'}
        onClick={() => onChange(o.value)}
      />
    ))}
  </Stack>
);

export const SelectChoice = <T extends string>({ options, value, onChange, ariaLabel }: ChoiceProps<T>) => (
  <TextField
    select
    size="small"
    value={value}
    aria-label={ariaLabel}
    onChange={(e) => onChange(e.target.value as T)}
    sx={{ minWidth: 180 }}
  >
    {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
  </TextField>
);
