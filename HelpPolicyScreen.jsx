import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, HelpIcon, ShieldIcon } from './Icons.jsx';
import './HelpPolicyScreen.css';

export default function HelpPolicyScreen({ type }) {
  const { state, actions } = useApp();
  const isPrivacy = type === 'privacy';
  const faqs = Array.isArray(state.settings?.helpCenter?.faqs) ? state.settings.helpCenter.faqs : [];
  const privacySections = Array.isArray(state.settings?.helpCenter?.privacySections) ? state.settings.helpCenter.privacySections : [];

  return (
    <div className="page-wrapper help-policy-screen">
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('profile')} aria-label="Go back to profile">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">{isPrivacy ? 'Privacy Policy' : 'Help & FAQ'}</h2>
        <div />
      </header>

      <main className="help-policy-content">
        {isPrivacy ? (
          <section className="help-policy-card card" aria-labelledby="privacy-policy-title">
            <div className="help-policy-intro">
              <div className="help-policy-icon"><ShieldIcon size={20} /></div>
              <div>
                <h1 id="privacy-policy-title">Privacy Policy</h1>
                <p>How we handle your information.</p>
              </div>
            </div>
            {privacySections.length ? (
              <div className="help-policy-sections">
                {privacySections.map((section, index) => (
                  <section className="help-policy-section" key={`${section.title}-${index}`}>
                    <h2>{section.title}</h2>
                    <p>{section.content}</p>
                  </section>
                ))}
              </div>
            ) : (
              <p className="help-policy-empty">Our privacy policy will be available here soon.</p>
            )}
          </section>
        ) : (
          <section className="help-policy-card card" aria-labelledby="help-faq-title">
            <div className="help-policy-intro">
              <div className="help-policy-icon"><HelpIcon size={20} /></div>
              <div>
                <h1 id="help-faq-title">Help & FAQ</h1>
                <p>Answers to common questions.</p>
              </div>
            </div>
            {faqs.length ? (
              <div className="help-faq-list">
                {faqs.map((faq, index) => (
                  <details className="help-faq-item" key={`${faq.question}-${index}`}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            ) : (
              <p className="help-policy-empty">Our frequently asked questions will be available here soon.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
