import { useState } from 'react';
import { Button, Field, Stack, Surface } from '../../primitives';
import { useTracking, type TrackMap } from '../../../telemetry/tracking';
import type { SearchPayload } from '../../../telemetry/catalog';
import styles from './SearchBar.module.css';

type Actions = { submit: SearchPayload };

export const SearchBar = ({ vertical, initialDestination = '', onSearch, track }: {
  vertical: string; initialDestination?: string;
  onSearch: (destination: string, checkIn: string, guests: number) => void;
  track?: TrackMap<Actions>;
}) => {
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState('2026-11-04');
  const [guests, setGuests] = useState('2');

  const t = useTracking<Actions, { submit: () => SearchPayload }>(track, {
    submit: () => ({ vertical, destination }),
  });

  return (
    <Surface tone="raised" pad="md" radius="lg" elevation="popover">
      <div className={styles.bar}>
        <Field label="Where to" value={destination} onChange={setDestination} placeholder="City, region or resort" />
        <Field label="Check in" type="date" value={checkIn} onChange={setCheckIn} />
        <Field label="Guests" type="number" value={guests} onChange={setGuests} />
        <Stack justify="end">
          <Button size="lg" onClick={() => { t.submit(); onSearch(destination, checkIn, Number(guests)); }}>
            Search
          </Button>
        </Stack>
      </div>
    </Surface>
  );
};
