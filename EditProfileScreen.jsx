import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft } from './Icons.jsx';
import './ProfileScreen.css';

export default function EditProfileScreen() {
  const { state, actions } = useApp();
  const profile = state.userProfile || {};
  const [name, setName] = useState(profile.fullName || state.user?.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [occupation, setOccupation] = useState(profile.occupation || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(profile.photoURL || state.user?.photoURL || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview?.startsWith('blob:') && URL.revokeObjectURL(preview), [preview]);

  const choosePhoto = event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/') || selected.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const save = async event => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || cleanPhone.length !== 10) {
      setError('Enter your name and a valid 10-digit phone number.');
      return;
    }
    setSaving(true);
    try {
      await actions.saveProfile({ ...profile, fullName: name.trim(), phone: cleanPhone, gender, occupation }, file);
      actions.navigate('profile');
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper profile-screen">
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('profile')} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h2 className="screen-title">Edit Profile</h2><div />
      </header>
      <form className="profile-edit-form card animate-fade" onSubmit={save}>
        <div className="profile-photo-editor">
          <div className="profile-avatar profile-avatar-large">
            {preview ? <img src={preview} alt="Profile preview" className="avatar-img" /> :
              <span className="avatar-initials">{(name || 'U')[0].toUpperCase()}</span>}
          </div>
          <label className="btn btn-outline btn-sm photo-picker">
            Choose photo
            <input type="file" accept="image/*" onChange={choosePhoto} hidden />
          </label>
          <small>JPG, PNG or WEBP · max 5 MB</small>
        </div>
        <div className="input-group"><label>Full Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} required /></div>
        <div className="input-group"><label>Email</label><input className="input-field" value={state.user?.email || profile.email || ''} disabled /></div>
        <div className="input-group"><label>Phone Number</label><input className="input-field" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required /></div>
        <div className="input-group"><label>Gender</label><select className="input-field" value={gender} onChange={e => setGender(e.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></div>
        <div className="input-group"><label>Occupation</label><input className="input-field" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g. Designer" /></div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-gold btn-full" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </div>
  );
}
