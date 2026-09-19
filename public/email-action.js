import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  getAuth,
  verifyPasswordResetCode,
} from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';

const MARKER_PREFIX = 'izem-email-action-v1:';
const MARKER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const elements = {
  controls: document.querySelector('#action-controls'),
  error: document.querySelector('#action-error'),
  icon: document.querySelector('#status-icon'),
  kicker: document.querySelector('#action-kicker'),
  message: document.querySelector('#action-message'),
  note: document.querySelector('#action-note'),
  statusGlyph: document.querySelector('#status-glyph'),
  title: document.querySelector('#action-title'),
};

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? '';
const actionCode = params.get('oobCode') ?? '';

function clearControls() {
  elements.controls.replaceChildren();
  elements.error.hidden = true;
  elements.error.textContent = '';
  elements.note.hidden = true;
  elements.note.textContent = '';
}

function setView({ tone, glyph, kicker, title, message }) {
  elements.icon.className = `status-icon status-icon--${tone}`;
  elements.statusGlyph.textContent = glyph;
  elements.kicker.textContent = kicker;
  elements.title.textContent = title;
  elements.message.textContent = message;
  document.title = `${title} · IZEM`;
  clearControls();
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function showNote(message) {
  elements.note.textContent = message;
  elements.note.hidden = false;
}

function makeButton(label, onClick) {
  const button = document.createElement('button');
  button.className = 'primary-button';
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', async () => {
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = 'Working…';
    elements.error.hidden = true;
    try {
      await onClick();
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  });
  return button;
}

function addHomeLink(label = 'IZEM home') {
  const link = document.createElement('a');
  link.className = 'secondary-link';
  link.href = '/';
  link.textContent = label;
  elements.controls.append(link);
}

function friendlyError(error) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  if (code === 'auth/network-request-failed') {
    return 'Chrome could not reach the verification service. Check your connection and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'There were too many attempts. Wait a few minutes, then try again.';
  }
  return 'This link is invalid, expired, or has already been used.';
}

async function markerKey() {
  if (!actionCode || !window.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(`${mode}:${actionCode}`);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
  return `${MARKER_PREFIX}${hash}`;
}

async function hasSuccessMarker() {
  try {
    const key = await markerKey();
    if (!key) return false;
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return false;
    const value = JSON.parse(rawValue);
    if (typeof value.completedAt !== 'number' || Date.now() - value.completedAt > MARKER_MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function rememberSuccess() {
  try {
    const key = await markerKey();
    if (!key) return;
    window.localStorage.setItem(key, JSON.stringify({ completedAt: Date.now() }));
  } catch {
    // Private browsing and locked-down storage must not turn success into an error.
  }
}

function showVerificationSuccess() {
  setView({
    tone: 'success',
    glyph: '✓',
    kicker: 'Verification complete',
    title: 'Email verified',
    message: 'Your email address was verified successfully. Close this tab, return to the IZEM app, and tap “I’ve verified my email.”',
  });
  addHomeLink();
}

function showPasswordResetSuccess() {
  setView({
    tone: 'success',
    glyph: '✓',
    kicker: 'Password updated',
    title: 'Your password is reset',
    message: 'Your new password is ready. Return to the IZEM app and sign in.',
  });
  addHomeLink();
}

function showAccountUpdateSuccess(title, message) {
  setView({
    tone: 'success',
    glyph: '✓',
    kicker: 'Account updated',
    title,
    message,
  });
  addHomeLink();
}

function showUsedOrExpiredLink(error) {
  const isVerification = mode === 'verifyEmail';
  setView({
    tone: 'warning',
    glyph: '!',
    kicker: isVerification ? 'Check your account' : 'One-time link closed',
    title: isVerification ? 'Your email may already be verified' : 'Request a fresh link',
    message: isVerification
      ? 'This one-time verification link has already been used or is no longer active.'
      : friendlyError(error),
  });
  showNote('If you already tapped the link, the action may have completed successfully. Return to IZEM and check your account. If it did not complete, request a fresh email from the app.');
  addHomeLink();
}

async function handleVerifyEmail(auth) {
  if (await hasSuccessMarker()) {
    showVerificationSuccess();
    return;
  }

  try {
    await checkActionCode(auth, actionCode);
  } catch (error) {
    showUsedOrExpiredLink(error);
    return;
  }

  setView({
    tone: 'ready',
    glyph: '→',
    kicker: 'One last step',
    title: 'Verify your email',
    message: 'Tap below to confirm that this email address belongs to you. The link is not used until you tap the button.',
  });
  elements.controls.append(makeButton('Verify email', async () => {
    try {
      await applyActionCode(auth, actionCode);
      await rememberSuccess();
      showVerificationSuccess();
    } catch (error) {
      if (await hasSuccessMarker()) {
        showVerificationSuccess();
        return;
      }
      showUsedOrExpiredLink(error);
    }
  }));
}

function createPasswordField(label, autocomplete) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  const fieldLabel = document.createElement('label');
  const input = document.createElement('input');
  const fieldId = `password-${autocomplete}`;
  fieldLabel.htmlFor = fieldId;
  fieldLabel.textContent = label;
  input.id = fieldId;
  input.name = fieldId;
  input.type = 'password';
  input.autocomplete = autocomplete;
  input.required = true;
  input.minLength = 12;
  wrapper.append(fieldLabel, input);
  return { wrapper, input };
}

async function handleResetPassword(auth) {
  if (await hasSuccessMarker()) {
    showPasswordResetSuccess();
    return;
  }

  try {
    await verifyPasswordResetCode(auth, actionCode);
  } catch (error) {
    showUsedOrExpiredLink(error);
    return;
  }

  setView({
    tone: 'ready',
    glyph: '→',
    kicker: 'Secure password reset',
    title: 'Choose a new password',
    message: 'Enter a new password for your IZEM account.',
  });

  const form = document.createElement('form');
  form.className = 'controls';
  const password = createPasswordField('New password', 'new-password');
  const confirmation = createPasswordField('Confirm new password', 'new-password-confirmation');
  const requirements = document.createElement('p');
  requirements.className = 'requirements';
  requirements.textContent = 'Use at least 12 characters, including uppercase, lowercase, a number, and a symbol.';
  const submit = document.createElement('button');
  submit.className = 'primary-button';
  submit.type = 'submit';
  submit.textContent = 'Reset password';
  form.append(password.wrapper, confirmation.wrapper, requirements, submit);
  elements.controls.append(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.error.hidden = true;
    if (password.input.value !== confirmation.input.value) {
      showError('The two passwords do not match.');
      confirmation.input.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Updating…';
    try {
      await confirmPasswordReset(auth, actionCode, password.input.value);
      password.input.value = '';
      confirmation.input.value = '';
      await rememberSuccess();
      showPasswordResetSuccess();
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
      if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') {
        showError('That password does not meet the requirements above.');
      } else {
        showError(friendlyError(error));
      }
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
        submit.textContent = 'Reset password';
      }
    }
  });
}

async function handleApplyWithConfirmation(auth, options) {
  if (await hasSuccessMarker()) {
    showAccountUpdateSuccess(options.successTitle, options.successMessage);
    return;
  }

  try {
    await checkActionCode(auth, actionCode);
  } catch (error) {
    showUsedOrExpiredLink(error);
    return;
  }

  setView({
    tone: 'ready',
    glyph: '→',
    kicker: options.kicker,
    title: options.title,
    message: options.message,
  });
  elements.controls.append(makeButton(options.buttonLabel, async () => {
    try {
      await applyActionCode(auth, actionCode);
      await rememberSuccess();
      showAccountUpdateSuccess(options.successTitle, options.successMessage);
    } catch (error) {
      showUsedOrExpiredLink(error);
    }
  }));
}

async function start() {
  if (!mode || !actionCode) {
    setView({
      tone: 'error',
      glyph: '×',
      kicker: 'Invalid link',
      title: 'This link is incomplete',
      message: 'Open the complete link from your IZEM email, or request a fresh email from the app.',
    });
    addHomeLink();
    return;
  }

  try {
    const response = await fetch('/__/firebase/init.json', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('Firebase configuration unavailable');
    const firebaseConfig = await response.json();
    const auth = getAuth(initializeApp(firebaseConfig));

    switch (mode) {
      case 'verifyEmail':
        await handleVerifyEmail(auth);
        break;
      case 'resetPassword':
        await handleResetPassword(auth);
        break;
      case 'recoverEmail':
        await handleApplyWithConfirmation(auth, {
          kicker: 'Protect your account',
          title: 'Restore your previous email',
          message: 'Only continue if you did not authorize the recent email-address change.',
          buttonLabel: 'Restore previous email',
          successTitle: 'Previous email restored',
          successMessage: 'Your sign-in email was restored. Return to IZEM and reset your password if you did not make the original change.',
        });
        break;
      case 'verifyAndChangeEmail':
        await handleApplyWithConfirmation(auth, {
          kicker: 'Confirm email change',
          title: 'Verify your new email',
          message: 'Tap below to verify and finish changing the email address on your IZEM account.',
          buttonLabel: 'Verify and change email',
          successTitle: 'New email verified',
          successMessage: 'Your new sign-in email was verified successfully. Return to the IZEM app.',
        });
        break;
      case 'revertSecondFactorAddition':
        await handleApplyWithConfirmation(auth, {
          kicker: 'Protect your account',
          title: 'Remove the new sign-in method',
          message: 'Only continue if you did not add the recent two-step verification method.',
          buttonLabel: 'Remove sign-in method',
          successTitle: 'Sign-in method removed',
          successMessage: 'The recently added two-step verification method was removed. Return to IZEM and secure your account.',
        });
        break;
      default:
        setView({
          tone: 'error',
          glyph: '×',
          kicker: 'Unsupported link',
          title: 'IZEM cannot open this link',
          message: 'Request a fresh account email from the IZEM app or contact support.',
        });
        addHomeLink();
    }
  } catch (error) {
    setView({
      tone: 'error',
      glyph: '×',
      kicker: 'Connection problem',
      title: 'We could not check this link',
      message: friendlyError(error),
    });
    showNote('Your account has not been changed by this page. Check your connection and reload, or return to the IZEM app.');
    addHomeLink();
  }
}

void start();
