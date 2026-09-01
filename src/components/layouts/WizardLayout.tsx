/* ============================================================================
   WIZARD LAYOUT
   A shell with three gaps: the progress list, the step currently showing, and
   the buttons underneath.

   It does not know how many steps there are, what they contain, or when one is
   finished. Give it a different arrangement and the steps do not change.
   ========================================================================= */

import type { ReactNode } from 'react';

import { Surface } from '../primitives';
import { Container } from './PageLayout';
import styles from './WizardLayout.module.css';

export type WizardLayoutProps = {
  /** Usually <WizardSteps/>, but a brand could show anything here. */
  progress: ReactNode;
  step: ReactNode;
  actions?: ReactNode;
  /** The order summary, or whatever a brand wants beside the form. */
  summary?: ReactNode;
};

export const WizardLayout = ({ progress, step, actions, summary }: WizardLayoutProps) => (
  <Container>
    <div className={styles.wizard}>
      <div className={styles.main}>
        {step}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <aside className={styles.aside}>
        <Surface tone="raised" pad="md" radius="lg" bordered>{progress}</Surface>
        {summary}
      </aside>
    </div>
  </Container>
);

/** The default progress list. A presenter: it draws what it is handed, and
    offers one action. Whether going back is allowed is not its decision — if
    nobody passes onSelect, the list is not clickable. */
export const WizardSteps = ({ steps, current, onSelect }: {
  steps: { id: string; label: string }[];
  current: number;
  onSelect?: (id: string, index: number) => void;
}) => (
  <ol className={styles.steps}>
    {steps.map((s, i) => {
      const state = i === current ? 'current' : i < current ? 'done' : 'todo';
      const clickable = onSelect !== undefined && state === 'done';
      return (
        <li key={s.id}>
          <button
            type="button"
            className={styles.step}
            data-state={state}
            disabled={!clickable}
            onClick={clickable ? () => onSelect(s.id, i) : undefined}
          >
            <span className={styles.marker}>{i < current ? '✓' : i + 1}</span>
            {s.label}
          </button>
        </li>
      );
    })}
  </ol>
);
