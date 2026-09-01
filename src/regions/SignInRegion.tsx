/* ============================================================================
   SIGN-IN  ·  region
   Loads nothing on entry — proof that a region is not a page loader. It owns
   a mutation, maps its Rejection to copy, and maps Validation failures to
   field-level copy the form renders inline.
   ========================================================================= */

import { useState } from 'react';

import { Badge, Stack, Text } from '../components/primitives';
import { SplitSignIn } from '../components/layouts';
import { SignInForm } from '../components/presenters';
import { rejection, validation, type Failure } from '../errors/failure';
import { failureMessage } from '../errors/messages';
import { useEmit } from '../telemetry/context';
import { useLoad } from '../data/useLoad';
import { useToast } from '../app/useToast';
import { useBrand } from '../app/brand';
import { useRouter } from '../app/router';
import { armArrival } from '../app/arrival';
import { signIn } from '../app/session';
import styles from './SignInRegion.module.css';

export const SignInRegion = () => {
  const brand = useBrand();
  const router = useRouter();
  const { showFailure } = useToast();
  const SignInAside = brand.overrides?.auth?.Aside;
  /* Where the parts go is the brand's. What happens when you submit is not. */
  const SignInLayout = brand.overrides?.auth?.Layout ?? SplitSignIn;
  const emit = useEmit();

  // Nothing to fetch — but this is still a region: it owns a mutation, and it
  // reports its own view. The scope that tags everything below comes from the
  // <Analytics> wrapper around it, not from here.
  useLoad({}, { pageView: 'SIGN_IN_VIEWED' });

  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  const submit = async (email: string, password: string) => {
    setFailure(null);

    /* Validation: client-side, shown at the field, not an error in telemetry. */
    if (!email.includes('@')) return setFailure(validation('email', 'EMAIL_FORMAT'));
    if (password.length < 8) return setFailure(validation('password', 'PASSWORD_SHORT'));

    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);

    /* Rejection: the backend said no for a business reason. Specific copy. */
    if (password !== 'password123') {
      // A rejection the user can act on: toast, exactly like the current app.
      const failed = rejection('BAD_CREDENTIALS', "That email and password don't match.", true);
      setFailure(failed);
      showFailure(failed);
      emit('OPERATION_FAILED', {
        kind: failed.kind, code: failed.code, region: 'auth.signin', retryable: failed.retryable,
      });
      return;
    }

    emit('SIGN_IN_SUCCEEDED', { method: 'password' });
    /* The next page arrives rather than appears. Both are set here, in the
       handler that caused them, so nothing downstream has to watch for a
       sign-in. */
    signIn();
    armArrival();
    router.go({ name: 'landing' });
  };

  // Validation stays at the field. Everything else went to the toast already.
  const fieldErrors =
    failure?.kind === 'validation' ? { [failure.field]: failureMessage(failure) } : undefined;

  return (
    <SignInLayout
      media={<img className={styles.media} src={brand.signInImage} alt="" />}
      /* The brand's line. Where it goes, and what it sits on, is the
         layout's business — so the region does not colour it. */
      aside={SignInAside ? <SignInAside /> : <Badge tone="solid">Welcome back</Badge>}
      copy={
        <Stack gap={2}>
          <Text variant="displayMd">Sign in</Text>
          <Text variant="body" tone="secondary">
            Use <code className={styles.hint}>password123</code> with any valid email.
          </Text>
        </Stack>
      }
    >
      <SignInForm
        busy={busy}
        errors={fieldErrors}
        onSubmit={submit}
        onSignUp={() => {}}
        onForgotPassword={() => {}}
        track={{
          submit: 'SIGN_IN_SUBMITTED',
          requestSignUp: 'SIGN_UP_REQUESTED',
          requestReset: 'PASSWORD_RESET_REQUESTED',
        }}
      />
    </SignInLayout>
  );
};
