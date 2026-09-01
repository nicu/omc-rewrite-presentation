/* ============================================================================
   FAILURE MODEL
   Split by WHAT HAPPENED, not by who consumes it. Everything is logged;
   only some things are shown; how it is shown is a separate decision made
   by the region, not encoded in the failure.
   ========================================================================= */

export type Fault = {
  kind: 'fault';
  /** Internal, for logging only — never shown to a user. */
  code: string;
  cause?: unknown;
};

export type Rejection = {
  kind: 'rejection';
  code: string;
  retryable: boolean;
  /** What the API actually said. Our API does not return error codes, so this
   *  is the only user-facing text we have; there is nothing to look up. */
  message?: string;
  detail?: Record<string, unknown>;
};

export type Validation = {
  kind: 'validation';
  field: string;
  code: string;
};

export type Failure = Fault | Rejection | Validation;

export const fault = (code: string, cause?: unknown): Fault => ({ kind: 'fault', code, cause });
export const rejection = (code: string, message?: string, retryable = false): Rejection =>
  ({ kind: 'rejection', code, message, retryable });
export const validation = (field: string, code: string): Validation => ({ kind: 'validation', field, code });

export const isFailure = (e: unknown): e is Failure =>
  typeof e === 'object' && e !== null && 'kind' in e &&
  ['fault', 'rejection', 'validation'].includes((e as Failure).kind);
