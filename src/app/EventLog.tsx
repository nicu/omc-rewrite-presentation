/* ============================================================================
   EVENT LOG  ·  POC instrument
   Renders what the adapters emitted. Not part of the architecture — it exists
   so the telemetry model can be watched working while you click around.
   ========================================================================= */

import { useSyncExternalStore } from 'react';

import { eventLog } from '../telemetry/adapters';
import styles from './EventLog.module.css';

export const EventLog = ({ destination }: { destination: string }) => {
  const lines = useSyncExternalStore(eventLog.subscribe, eventLog.snapshot);
  const visible = lines.filter((l) => l.destination === destination).slice(0, 40);

  if (visible.length === 0) {
    return <p className={styles.empty}>Nothing yet — interact with the page.</p>;
  }

  return (
    <ol className={styles.log}>
      {visible.map((line) => (
        <li key={line.seq} className={styles.line}>
          <code className={styles.name}>{line.name}</code>
          <span className={styles.props}>
            {Object.entries(line.props)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => `${k}=${String(v)}`)
              .join('  ')}
          </span>
        </li>
      ))}
    </ol>
  );
};
