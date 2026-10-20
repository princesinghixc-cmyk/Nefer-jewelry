/* ============================================================
   PwaInstallBanner.jsx
   Real Progressive Web App (PWA) installation system for Nefer.
   Uses the browser's native beforeinstallprompt API.
   ============================================================ */
import React, { useState, useEffect } from 'react';
import './PwaInstallBanner.css';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone / installed mode
    const isStandalone = () => {
      if (typeof window === 'undefined') return false;
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    if (isStandalone()) return;

    // 2. Check if dismissed for current session
    const isDismissed = () => {
      try {
        return sessionStorage.getItem('nefer_pwa_dismissed') === 'true';
      } catch (e) {
        return false;
      }
    };

    if (isDismissed()) return;

    // 3a. The beforeinstallprompt event often fires BEFORE React mounts.
    //     index.html captures it early into window.deferredPwaPrompt.
    //     Pick it up immediately if already captured.
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
      setIsInstallable(true);
    }

    // 3b. Native beforeinstallprompt listener (fires if not yet captured)
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.deferredPwaPrompt = event;
      setDeferredPrompt(event);
      setIsInstallable(true);
      setShowIosPrompt(false);
    };

    // 3c. Custom re-dispatch from index.html for late-mounting components
    const handleCustomPrompt = (event) => {
      const prompt = event.detail;
      if (!prompt) return;
      setDeferredPrompt(prompt);
      setIsInstallable(true);
      setShowIosPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('nefer-beforeinstallprompt', handleCustomPrompt);

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setShowIosPrompt(false);
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
      try {
        sessionStorage.setItem('nefer_pwa_dismissed', 'true');
      } catch (e) {}
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. iOS Safari detection (where beforeinstallprompt is not supported)
    const isIosDevice = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios/.test(userAgent);
      return isIos && isSafari;
    };

    if (isIosDevice() && !isStandalone() && !isDismissed()) {
      const timer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('nefer-beforeinstallprompt', handleCustomPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('nefer-beforeinstallprompt', handleCustomPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Real browser PWA installation trigger
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Trigger the real browser installation dialog
      await deferredPrompt.prompt();
      // Wait for the user's choice
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
    } catch (error) {
      console.warn('[PWA] Error launching install prompt:', error);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsInstallable(false);
    setShowIosPrompt(false);
    try {
      sessionStorage.setItem('nefer_pwa_dismissed', 'true');
    } catch (e) {}
  };

  // Only render if installable via beforeinstallprompt or iOS instruction needed
  if (!isInstallable && !showIosPrompt) {
    return null;
  }

  return (
    <aside className="nefer-pwa-banner" role="banner" aria-label="Install Nefer App">
      <div className="nefer-pwa-banner-content">
        <div className="nefer-pwa-logo-box">
          <img
            src="/pwa-192x192.png"
            alt="Nefer App Icon"
            className="nefer-pwa-logo"
            onError={(e) => {
              e.target.src = '/logo-mark-transparent.png';
            }}
          />
        </div>

        <div className="nefer-pwa-text">
          <strong className="nefer-pwa-title">Install Nefer Quick App</strong>
          {showIosPrompt ? (
            <span className="nefer-pwa-subtitle">
              ⚡ Tap <strong>Share</strong> <span className="nefer-pwa-ios-icon">⎋</span> then <strong>Add to Home Screen ⊕</strong>
            </span>
          ) : (
            <span className="nefer-pwa-subtitle">
              ⚡ 1-Tap → 3-min deliveries to your doorstep
            </span>
          )}
        </div>

        <div className="nefer-pwa-actions">
          {isInstallable && (
            <button
              type="button"
              className="nefer-pwa-install-btn"
              onClick={handleInstallClick}
              id="pwa-install-btn"
            >
              Install
            </button>
          )}

          <button
            type="button"
            className="nefer-pwa-close-btn"
            onClick={handleDismiss}
            aria-label="Dismiss installation prompt"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
