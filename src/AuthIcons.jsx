/* ============================================
   AUTH ICONS
   Shared SVG icons used across LoginPage,
   SignupPage, and ForgotPasswordPage.
   Keeping them here means one edit updates
   the icon everywhere it's used.
   ============================================ */

export function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 5 9 5a15 15 0 0 1-2.1 2.5M6.6 6.6C4.4 8 3 10 3 10s4 5 9 5c1.1 0 2.2-.3 3.1-.7" />
    </svg>
  );
}

/**
 * GoogleIcon — the 4-color "G" logo used on
 * "Continue with Google" buttons.
 */
export function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.9V7.5H3.04A10 10 0 0 0 2 12c0 1.62.38 3.14 1.04 4.52l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.8.5 3.83 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.35 2.6C7.18 7.72 9.39 5.95 12 5.95Z" />
    </svg>
  );
}