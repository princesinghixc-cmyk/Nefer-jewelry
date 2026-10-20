/* ============================================================
   ProfileScreen.jsx — User Profile for NEFER Jewelry
   Features: Avatar, menu items, edit profile, logout
   ============================================================ */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, OrdersIcon, MapPinIcon, HeadphonesIcon, HelpIcon, ShieldIcon, ChevronRight, LogoutIcon, EditIcon, SettingsIcon, InstagramIcon, GoogleIcon } from './Icons.jsx';
import './ProfileScreen.css';

const INSTAGRAM_PAGES = [
  { handle: '@the.nefer', url: 'https://www.instagram.com/the.nefer/' },
  { handle: '@the.neferjewelry', url: 'https://www.instagram.com/the.neferjewelry/' },
  { handle: '@neferindia', url: 'https://www.instagram.com/neferindia/' }
];

export default function ProfileScreen() {
  const { state, actions } = useApp();
  const { user, userProfile, isAdmin } = state;
  const accountName = user?.displayName || userProfile?.fullName || 'User';
  const [showInstagramPages, setShowInstagramPages] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setLoggingIn(true);
    try {
      await actions.loginWithGoogle();
    } catch (error) {
      const messages = {
        'auth/popup-closed-by-user': 'The Google sign-in window was closed. Please try again.',
        'auth/popup-blocked': 'Your browser blocked Google sign-in. Allow popups for this site and try again.',
        'auth/unauthorized-domain': 'This website is not authorized for Google sign-in in Firebase.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Authentication.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.'
      };
      setAuthError(messages[error?.code] || 'Google sign-in failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };
  const menuItems = [
    { icon: <OrdersIcon size={20} />, label: 'My Orders', desc: 'View order history & tracking', action: () => actions.navigate('orders') },
    { icon: <MapPinIcon size={20} />, label: 'Saved Addresses', desc: 'Manage delivery addresses', action: () => actions.navigate('addresses') },
    { icon: <HeadphonesIcon size={20} />, label: 'Customer Care Support', desc: 'Chat with us on WhatsApp', action: () => window.open('https://wa.me/919115577310', '_blank') },
    { icon: <HelpIcon size={20} />, label: 'Help & FAQ', desc: 'Common questions answered', action: () => actions.navigate('help') },
    { icon: <ShieldIcon size={20} />, label: 'Privacy Policy', desc: 'How we handle your information', action: () => actions.navigate('privacy') },
  ];

  return (
    <div className="page-wrapper profile-screen">
      {/* Header */}
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('home')} id="profile-back-btn" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">Profile</h2>
        <div></div>
      </header>

      {/* Profile Card */}
      <div className="profile-card card animate-fade">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user?.photoURL || userProfile?.photoURL ? (
              <img src={user?.photoURL || userProfile.photoURL} alt="Avatar" className="avatar-img" />
            ) : (
              <span className="avatar-initials">{accountName[0].toUpperCase()}</span>
            )}
          </div>
          <div className="profile-info">
            {
              <>
                <h3 className="profile-name">{accountName}</h3>
                <p className="profile-email">{user?.email || 'demo@nefer.com'}</p>
                {userProfile?.phone && <p className="profile-phone">+91 {userProfile.phone}</p>}
              </>
            }
          </div>
          {
            <button className="edit-btn" onClick={() => actions.navigate('edit-profile')} id="edit-profile-btn">
              <EditIcon size={16} />
            </button>
          }
        </div>
      </div>

      

      {/* Admin Panel Access */}
      {isAdmin && (
        <div className="profile-menu card animate-fade" style={{ animationDelay: '0.1s' }}>
          <button className="menu-item admin-item" onClick={() => actions.navigate('admin')} id="admin-panel-btn">
            <div className="menu-icon admin-icon">
              <SettingsIcon size={20} />
            </div>
            <div className="menu-text">
              <span className="menu-label">Admin Panel</span>
              <span className="menu-desc">Manage products, orders & coupons</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </button>
        </div>
      )}

      {/* Login with Google Button */}
      <div className="profile-menu card animate-fade" style={{ animationDelay: '0.12s' }}>
        <button
          className="menu-item google-menu-item"
          onClick={handleGoogleLogin}
          disabled={loggingIn}
          id="profile-google-menu-item"
        >
          <div className="menu-icon google-menu-icon" style={{ background: '#fff', border: '1px solid #e0deda', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GoogleIcon size={20} />
          </div>
          <div className="menu-text">
            <span className="menu-label" style={{ fontWeight: 600 }}>Login with Google</span>
            <span className="menu-desc">Sign in with your Google account</span>
          </div>
          <ChevronRight size={18} className="menu-arrow" />
        </button>
        {authError && <p className="field-error" style={{ padding: '8px 16px', margin: 0, textAlign: 'center' }}>{authError}</p>}
      </div>
      {/* Menu Items */}
      <div className="profile-menu card animate-fade" style={{ animationDelay: '0.15s' }}>
        {menuItems.map((item, idx) => (
          <button key={idx} className="menu-item" onClick={item.action} id={`menu-${item.label.replace(/\s/g, '-').toLowerCase()}`}>
            <div className="menu-icon">{item.icon}</div>
            <div className="menu-text">
              <span className="menu-label">{item.label}</span>
              <span className="menu-desc">{item.desc}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </button>
        ))}
      </div>

      {/* Official Instagram pages */}
      <div className="profile-menu card instagram-menu animate-fade" style={{ animationDelay: '0.18s' }}>
        <button
          className="menu-item instagram-toggle"
          onClick={() => setShowInstagramPages(previous => !previous)}
          aria-expanded={showInstagramPages}
          id="instagram-pages-btn"
        >
          <div className="menu-icon instagram-icon">
            <InstagramIcon size={20} />
          </div>
          <div className="menu-text">
            <span className="menu-label">Follow NEFER on Instagram</span>
            <span className="menu-desc">See our official Instagram pages</span>
          </div>
          <ChevronRight size={18} className={`menu-arrow ${showInstagramPages ? 'instagram-arrow-open' : ''}`} />
        </button>
        {showInstagramPages && (
          <div className="instagram-pages" aria-label="Official NEFER Instagram pages">
            {INSTAGRAM_PAGES.map(page => (
              <a
                className="instagram-page-link"
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                key={page.handle}
              >
                <InstagramIcon size={17} />
                <span>{page.handle}</span>
                <ChevronRight size={16} className="menu-arrow" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="profile-menu card animate-fade" style={{ animationDelay: '0.2s' }}>
        <button className="menu-item logout-item" onClick={actions.logout} id="logout-btn">
          <div className="menu-icon logout-icon">
            <LogoutIcon size={20} />
          </div>
          <div className="menu-text">
            <span className="menu-label" style={{ color: 'var(--clr-danger)' }}>Logout</span>
            <span className="menu-desc">Sign out of your account</span>
          </div>
        </button>
      </div>
    </div>
  );
}
