import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, MapPinIcon } from './Icons.jsx';
import './SavedAddressesScreen.css';

export default function SavedAddressesScreen() {
  const { state, actions } = useApp();
  const savedAddress = state.userProfile?.savedAddress || {};
  const [fullName, setFullName] = useState(savedAddress.fullName || state.user?.displayName || '');
  const [phone, setPhone] = useState(savedAddress.phone || '');
  const [houseNo, setHouseNo] = useState(savedAddress.houseNo || '');
  const [street, setStreet] = useState(savedAddress.street || '');
  const [locality, setLocality] = useState(savedAddress.locality || '');
  const [city, setCity] = useState(savedAddress.city || '');
  const [stateName, setStateName] = useState(savedAddress.state || '');
  const [pinCode, setPinCode] = useState(savedAddress.pinCode || '');
  const [landmark, setLandmark] = useState(savedAddress.landmark || '');

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async event => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!houseNo.trim()) {
      setError('Please enter House/Flat No.');
      return;
    }
    if (!street.trim()) {
      setError('Please enter Building/Street/Colony.');
      return;
    }
    if (!locality.trim()) {
      setError('Please enter Area/Locality.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter City.');
      return;
    }
    if (!stateName.trim()) {
      setError('Please enter State.');
      return;
    }
    if (!pinCode.trim() || pinCode.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid 6-digit PIN Code.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formattedAddress = [
        houseNo.trim(),
        street.trim(),
        locality.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : '',
        city.trim(),
        stateName.trim(),
        pinCode.trim()
      ].filter(Boolean).join(', ');

      await actions.saveAddress({
        fullName: fullName.trim(),
        phone: cleanPhone,
        houseNo: houseNo.trim(),
        street: street.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pinCode: pinCode.trim(),
        landmark: landmark.trim(),
        address: formattedAddress
      });
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper saved-addresses-screen">
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('profile')} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">Saved Addresses</h2>
        <div />
      </header>

      <form className="saved-address-card card animate-fade" onSubmit={handleSave}>
        <div className="saved-address-heading">
          <div className="menu-icon"><MapPinIcon size={20} /></div>
          <div>
            <h3>Default delivery address</h3>
            <p>It will be filled automatically at checkout.</p>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="saved-address-name">Full Name</label>
          <input id="saved-address-name" className="input-field" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" />
        </div>
        <div className="input-group">
          <label htmlFor="saved-address-phone">Phone Number</label>
          <input id="saved-address-phone" className="input-field" value={phone} maxLength={10} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" />
        </div>
        <div className="input-group">
          <label htmlFor="saved-address-house">House / Flat No.</label>
          <input id="saved-address-house" className="input-field" value={houseNo} onChange={event => setHouseNo(event.target.value)} placeholder="House/Flat No., Floor, Apartment" />
        </div>
        <div className="input-group">
          <label htmlFor="saved-address-street">Building / Street / Colony</label>
          <input id="saved-address-street" className="input-field" value={street} onChange={event => setStreet(event.target.value)} placeholder="Building name, Street, Colony, Road" />
        </div>
        <div className="input-group">
          <label htmlFor="saved-address-locality">Area / Locality</label>
          <input id="saved-address-locality" className="input-field" value={locality} onChange={event => setLocality(event.target.value)} placeholder="Area, Sector, Locality" />
        </div>
        <div className="checkout-row" style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="saved-address-city">City</label>
            <input id="saved-address-city" className="input-field" value={city} onChange={event => setCity(event.target.value)} placeholder="City" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="saved-address-state">State</label>
            <input id="saved-address-state" className="input-field" value={stateName} onChange={event => setStateName(event.target.value)} placeholder="State" />
          </div>
        </div>
        <div className="checkout-row" style={{ display: 'flex', gap: '12px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="saved-address-pincode">PIN Code</label>
            <input id="saved-address-pincode" className="input-field" value={pinCode} maxLength={6} onChange={event => setPinCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="saved-address-landmark">Landmark (Optional)</label>
            <input id="saved-address-landmark" className="input-field" value={landmark} onChange={event => setLandmark(event.target.value)} placeholder="Nearby landmark" />
          </div>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        {saved && <p className="saved-address-success" role="status">Address saved successfully.</p>}
        <button className="btn btn-gold btn-full" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Address'}
        </button>
      </form>
    </div>
  );
}
