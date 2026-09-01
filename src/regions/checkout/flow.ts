/* ============================================================================
   THE FLOW
   A checkout is a list. Not a switch statement, not a state machine, not a
   component that knows about billing.

   Two optional questions hang off each step, and both are answered by pure
   functions in src/domain:

     when  — does this step apply to this booking at all?
     done  — has it already been answered?

   That is what turns the list from a fixed sequence into one that responds to
   the cart: apply a certificate that covers the total and the billing step
   stops existing, because there is nothing left to put on a card.
   ========================================================================= */

import type { ComponentType } from 'react';

import type { CheckoutContext } from '../../domain/checkout';

export type StepProps = {
  /** Called by the step when it is happy to move on. The flow never asks why. */
  onDone: () => void;
};

export type FlowStep = {
  id: string;
  label: string;
  /** The telemetry region for this step. It lives here, beside the component,
   *  rather than inside it: the step is rendered from this list, so this list
   *  is the call site, and <Analytics> has to be outside the component that
   *  loads. Written once here; a brand reordering the flow inherits it. */
  analytics: string;
  Step: ComponentType<StepProps>;
  /** Absent means "always". */
  when?: (ctx: CheckoutContext) => boolean;
  /** Absent means "we cannot tell", which is treated as not done. */
  done?: (ctx: CheckoutContext) => boolean;
};

export type Flow = FlowStep[];

/** The steps this particular booking has to go through. */
export const stepsFor = (flow: Flow, ctx: CheckoutContext): Flow =>
  flow.filter((step) => step.when?.(ctx) ?? true);

/** The earliest step still waiting for an answer — where someone who has
 *  pasted a link to a later step should be sent instead. */
export const firstUnfinished = (steps: Flow, ctx: CheckoutContext): FlowStep | undefined =>
  steps.find((step) => !(step.done?.(ctx) ?? false));
