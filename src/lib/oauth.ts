
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // User should replace this
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

export function getGoogleAuthUrl() {
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    prompt: 'select_account'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function initiateGoogleLogin() {
  window.location.href = getGoogleAuthUrl();
}
