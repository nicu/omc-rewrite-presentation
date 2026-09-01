/* ============================================================================
   SIGN-IN FORM  ·  presenter
   Owns its own input state (that is UI state, not server state) but nothing
   else. Validation failures arrive as resolved copy from the region.
   ========================================================================= */

import { useState } from 'react';
import { Button, Field, Stack, Text } from '../../primitives';
import { useTracking, type TrackMap } from '../../../telemetry/tracking';
import type { AuthPayload, EmptyPayload } from '../../../telemetry/catalog';

type Actions = {
  submit: AuthPayload;
  requestSignUp: EmptyPayload;
  requestReset: EmptyPayload;
};

export const SignInForm = ({
  onSubmit, onSignUp, onForgotPassword, errors, busy, track,
}: {
  onSubmit: (email: string, password: string) => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
  /** field -> already-resolved copy. The region did the lookup. */
  errors?: Record<string, string>;
  busy?: boolean;
  track?: TrackMap<Actions>;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const t = useTracking<Actions, {
    submit: () => AuthPayload; requestSignUp: () => EmptyPayload; requestReset: () => EmptyPayload;
  }>(track, {
    submit: () => ({ method: 'password' }),
    requestSignUp: () => ({} as EmptyPayload),
    requestReset: () => ({} as EmptyPayload),
  });

  return (
    <Stack as="form" gap={5}>
      <Field label="Email" type="email" value={email} onChange={setEmail}
             placeholder="you@example.com" error={errors?.email} />
      <Field label="Password" type="password" value={password} onChange={setPassword}
             error={errors?.password} hint="At least 8 characters" />

      <Button block size="lg" disabled={busy}
              onClick={() => { t.submit(); onSubmit(email, password); }}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>

      <Stack direction="horizontal" gap={4} justify="between" align="center">
        <button type="button" onClick={() => { t.requestReset(); onForgotPassword?.(); }}>
          <Text variant="caption" tone="brand" as="span">Forgot password?</Text>
        </button>
        <button type="button" onClick={() => { t.requestSignUp(); onSignUp?.(); }}>
          <Text variant="caption" tone="brand" as="span">Create an account</Text>
        </button>
      </Stack>
    </Stack>
  );
};
