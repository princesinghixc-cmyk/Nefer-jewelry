/* ============================================================
   LoginScreen.jsx — Authentication for NEFER Jewelry
   Step 1: Google Sign-in ONLY
   Step 2: Profile details (Name, Email, 10-digit Phone)
   ============================================================ */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { GoogleIcon } from './Icons.jsx';
import './LoginScreen.css';

export default function LoginScreen() {
  const { state, actions } = useApp();
  const [authError, setAuthError] = React.useState('');

  /* Handle Google Login / Demo Login */
  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const googleUser = await actions.loginWithGoogle();
      if (googleUser) actions.navigate(state.authReturnScreen || 'home');
    } catch (error) {
      const messages = {
        'auth/popup-closed-by-user': 'The Google sign-in window was closed. Please try again.',
        'auth/popup-blocked': 'Your browser blocked Google sign-in. Allow popups for this site and try again.',
        'auth/unauthorized-domain': 'This website is not authorized for Google sign-in in Firebase.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Authentication.',
        'auth/network-request-failed': 'Network error. Check your phone connection and try again.'
      };
      setAuthError(messages[error?.code] || `Google sign-in failed${error?.code ? ` (${error.code})` : ''}. Please try again.`);
    }
  };

  return (
    <div className="login-screen">
      {/* Decorative Background Elements */}
      <div className="login-bg-pattern">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      <div className="login-card animate-slide">
        {/* Logo Section */}
        <div className="login-logo-section">
          <div className="login-logo-circle" aria-hidden="true">
            <img src="/logo-mark-transparent.png" alt="" className="login-logo-img" />
          </div>
          <h1 className="login-brand">NEFER JEWELRY</h1>
          <p className="login-tagline">Premium Handcrafted Jewelry</p>
        </div>

        <div className="login-step animate-fade">
          <p className="login-welcome">Sign in with Google to continue to NEFER Jewelry.</p>
          <button className="btn-google" onClick={handleGoogleLogin} id="google-login-btn">
            <GoogleIcon size={20} />
            <span>Continue with Google</span>
          </button>
          {authError && <p className="field-error">{authError}</p>}
          <p className="login-terms">
            By continuing, you acknowledge our{' '}
            <a href="/privacy" onClick={event => { event.preventDefault(); actions.navigate('privacy'); }}>Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="login-footer">© 2024 NEFER Jewelry. All rights reserved.</p>
    </div>
  );
}
