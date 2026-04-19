import React, { useState } from 'react';

const ComingSoonPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Animated background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div style={styles.content}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <img
            src="/gappy-logo1.png"
            alt="Gappy Describe"
            style={styles.logo}
            data-testid="coming-soon-logo"
          />
        </div>

        {/* Badge */}
        <div style={styles.badge} data-testid="coming-soon-badge">
          <span style={styles.badgeDot} />
          Something big is brewing
        </div>

        {/* Heading */}
        <h1 style={styles.heading} data-testid="coming-soon-heading">
          We're building something
          <br />
          <span style={styles.gradientText}>extraordinary.</span>
        </h1>

        {/* Subtext */}
        <p style={styles.subtext} data-testid="coming-soon-subtext">
          Gappy Describe is getting a major upgrade. AI-powered video audio descriptions,
          WCAG compliance, and a whole new experience — launching soon.
        </p>

        {/* Email signup */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={styles.form} data-testid="coming-soon-form">
            <div style={styles.inputWrap}>
              <input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                data-testid="coming-soon-email-input"
              />
              <button type="submit" style={styles.submitBtn} data-testid="coming-soon-notify-btn">
                Notify Me
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.successMsg} data-testid="coming-soon-success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8, flexShrink: 0 }}>
              <circle cx="10" cy="10" r="10" fill="#00D4D4" fillOpacity="0.15"/>
              <path d="M6 10.5L8.5 13L14 7" stroke="#00D4D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            You're on the list. We'll be in touch.
          </div>
        )}

        {/* Footer links */}
        <div style={styles.footer} data-testid="coming-soon-footer">
          <a href="https://gappylabs.com" style={styles.footerLink} target="_blank" rel="noopener noreferrer">
            gappylabs.com
          </a>
          <span style={styles.footerDivider}>/</span>
          <a href="mailto:gappylabs@gmail.com" style={styles.footerLink}>
            gappylabs@gmail.com
          </a>
        </div>
      </div>

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -40px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 50px) scale(1.05); }
          66% { transform: translate(40px, -20px) scale(0.9); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#06060e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '40px 20px',
  },
  orb1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(233,30,140,0.12) 0%, transparent 70%)',
    top: '-10%',
    left: '-5%',
    animation: 'floatOrb1 18s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(107,93,211,0.10) 0%, transparent 70%)',
    bottom: '-8%',
    right: '-3%',
    animation: 'floatOrb2 22s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,212,0.08) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    animation: 'floatOrb3 15s ease-in-out infinite',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 620,
    width: '100%',
    textAlign: 'center',
    animation: 'fadeUp 0.8s ease-out both',
  },
  logoWrap: {
    marginBottom: 36,
  },
  logo: {
    height: 44,
    objectFit: 'contain',
    filter: 'brightness(1.1)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 100,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.02em',
    marginBottom: 32,
    fontFamily: "'Inter', sans-serif",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00D4D4',
    animation: 'pulseDot 2s ease-in-out infinite',
  },
  heading: {
    fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    marginBottom: 20,
    fontFamily: "'Inter', sans-serif",
  },
  gradientText: {
    background: 'linear-gradient(135deg, #E91E8C 0%, #6B5DD3 50%, #00D4D4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtext: {
    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.7,
    marginBottom: 40,
    fontFamily: "'Inter', sans-serif",
    maxWidth: 500,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  form: {
    marginBottom: 48,
  },
  inputWrap: {
    display: 'flex',
    gap: 0,
    maxWidth: 440,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '14px 18px',
    fontSize: 15,
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    minWidth: 0,
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #E91E8C 0%, #6B5DD3 100%)',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  },
  successMsg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#00D4D4',
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 48,
    fontFamily: "'Inter', sans-serif",
    animation: 'fadeUp 0.4s ease-out both',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
  },
  footerLink: {
    color: 'rgba(255,255,255,0.3)',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  footerDivider: {
    color: 'rgba(255,255,255,0.12)',
  },
};

export default ComingSoonPage;
