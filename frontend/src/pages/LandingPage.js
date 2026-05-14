import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Shield, Users } from 'lucide-react';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page} data-testid="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section style={styles.hero} data-testid="hero-section">
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <span style={styles.badge} data-testid="hero-badge">AI-POWERED ACCESSIBILITY</span>
            <h1 style={styles.heroTitle} data-testid="hero-title">
              Make Your Videos<br />Accessible with<br />
              <span style={styles.heroHighlight}>Gappy Describe.</span>
            </h1>
            <p style={styles.heroSub} data-testid="hero-subtitle">
              Automatically generate WCAG-compliant audio descriptions
              for your videos. Upload, analyze, and export in minutes.
            </p>
            <div style={styles.heroCta}>
              <button onClick={() => navigate('/signup')} style={styles.ctaBtn} data-testid="hero-cta">
                Get Started Free <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </button>
              <span style={styles.noCc}>
                <Check size={14} style={{ marginRight: 6, color: '#6A39F5' }} />
                No credit card required
              </span>
            </div>
            <div style={styles.trustRow} data-testid="hero-trust-badges">
              <div style={styles.trustItem}>
                <Shield size={18} color="#6A39F5" />
                <div>
                  <div style={styles.trustTitle}>WCAG 1.2.3</div>
                  <div style={styles.trustSub}>Level AA Compliant</div>
                </div>
              </div>
              <div style={styles.trustItem}>
                <Shield size={18} color="#6A39F5" />
                <div>
                  <div style={styles.trustTitle}>Enterprise-Grade</div>
                  <div style={styles.trustSub}>Security</div>
                </div>
              </div>
              <div style={styles.trustItem}>
                <Users size={18} color="#6A39F5" />
                <div>
                  <div style={styles.trustTitle}>Trusted by Educators</div>
                  <div style={styles.trustSub}>& Organizations</div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.heroRight}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={styles.bottomCta} data-testid="bottom-cta-section">
        <h2 style={styles.bottomCtaTitle}>Ready to Make Your Videos Accessible?</h2>
        <p style={styles.bottomCtaSub}>Join thousands of educators and organizations creating inclusive content.</p>
        <button onClick={() => navigate('/signup')} style={styles.ctaBtn} data-testid="bottom-cta-btn">
          Start Free Today <ArrowRight size={16} style={{ marginLeft: 8 }} />
        </button>
        <span style={{ ...styles.noCc, marginTop: 16 }}>
          <Check size={14} style={{ marginRight: 6, color: '#6A39F5' }} />
          No credit card required
        </span>
      </section>

      {/* Footer */}
      <footer style={styles.footer} data-testid="landing-footer">
        <div style={styles.footerInner}>
          <div style={styles.footerLeft}>
            <div style={styles.footerBrand}>GAPPY<span style={{ color: '#6A39F5' }}>LABS</span></div>
            <p style={styles.footerDesc}>
              AI-powered tools for accessible video.<br />
              Built for educators, creators, and<br />
              organizations committed to inclusion.
            </p>
          </div>
          <div style={styles.footerCenter}>
            <span style={styles.footerCopy}>&copy; 2025 Gappy Labs. All rights reserved.</span>
          </div>
          <div style={styles.footerRight}>
            <a href="/privacy" style={styles.footerLink}>Privacy</a>
            <a href="#" style={styles.footerLink}>Terms</a>
            <a href="mailto:gappylabs@gmail.com" style={styles.footerLink}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* Dashboard Mockup Component */
const DashboardMockup = () => (
  <div style={styles.mockup} data-testid="dashboard-mockup">
    {/* Mockup Header */}
    <div style={styles.mockupHeader}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#6A39F5' }}>Gappy Describe</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb' }} />
      </div>
    </div>
    <div style={styles.mockupBody}>
      {/* Sidebar */}
      <div style={styles.mockupSidebar}>
        {['Dashboard', 'Videos', 'Projects', 'Exports', 'Settings'].map((item, i) => (
          <div key={item} style={{ ...styles.mockupNavItem, ...(i === 0 ? { background: '#EAE8FF', color: '#6A39F5', fontWeight: 600 } : {}) }}>
            {item}
          </div>
        ))}
      </div>
      {/* Main Content */}
      <div style={styles.mockupContent}>
        <div style={styles.mockupTopBar}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e' }}>Dashboard</div>
            <div style={{ fontSize: 8, color: '#9ca3af' }}>Welcome back! Here's what's happening.</div>
          </div>
          <div style={styles.mockupUploadBtn}>Upload Video</div>
        </div>
        {/* Stats */}
        <div style={styles.mockupStats}>
          {[
            { val: '24', label: 'Videos Processed' },
            { val: '18', label: 'Descriptions Generated' },
            { val: '6.2 hrs', label: 'Time Saved' },
            { val: '98%', label: 'Accuracy Rate' },
          ].map((s) => (
            <div key={s.label} style={styles.mockupStat}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{s.val}</div>
              <div style={{ fontSize: 7, color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Recent Activity */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>Recent Activity</div>
          {[
            { title: 'Lecture: Renaissance Art History', time: '2 min ago', status: 'Completed' },
            { title: 'Campus Tour Video', time: '15 min ago', status: 'Completed' },
            { title: 'Physics Lab Demonstration', time: '32 min ago', status: 'Processing' },
          ].map((item) => (
            <div key={item.title} style={styles.mockupActivity}>
              <div style={styles.mockupThumb} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: '#1a1a2e' }}>{item.title}</div>
                <div style={{ fontSize: 7, color: '#9ca3af' }}>MP4 &middot; {item.time}</div>
              </div>
              <span style={{ fontSize: 7, color: item.status === 'Completed' ? '#10b981' : '#f59e0b', fontWeight: 500 }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#1a1a2e',
  },
  /* Hero */
  hero: {
    padding: '80px 32px 60px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  heroInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 60,
  },
  heroLeft: { flex: 1 },
  heroRight: { flex: 1, display: 'flex', justifyContent: 'center' },
  badge: {
    display: 'inline-block',
    background: '#EAE8FF',
    color: '#6A39F5',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: '6px 14px',
    borderRadius: 4,
    border: '1px solid #d4d0fb',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    lineHeight: 1.15,
    color: '#1a1a2e',
    marginBottom: 20,
    letterSpacing: '-0.02em',
  },
  heroHighlight: {
    color: '#6A39F5',
  },
  heroSub: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 1.7,
    marginBottom: 32,
    maxWidth: 420,
  },
  heroCta: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 48,
    flexWrap: 'wrap',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#1a1a2e',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px 28px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.2s',
  },
  noCc: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    color: '#6b7280',
  },
  trustRow: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  trustTitle: { fontSize: 12, fontWeight: 600, color: '#374151' },
  trustSub: { fontSize: 11, color: '#9ca3af' },
  /* Bottom CTA */
  bottomCta: {
    background: '#f9f8fe',
    padding: '80px 32px',
    textAlign: 'center',
  },
  bottomCtaTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  bottomCtaSub: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 28,
  },
  /* Footer */
  footer: {
    background: '#1a1a2e',
    padding: '48px 32px',
  },
  footerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 32,
  },
  footerLeft: {},
  footerBrand: {
    fontSize: 18,
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: '-0.01em',
  },
  footerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.7,
  },
  footerCenter: {
    display: 'flex',
    alignItems: 'center',
  },
  footerCopy: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  footerRight: {
    display: 'flex',
    gap: 24,
  },
  footerLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  /* Dashboard Mockup */
  mockup: {
    width: '100%',
    maxWidth: 480,
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    boxShadow: '0 20px 60px rgba(106, 57, 245, 0.08), 0 4px 20px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  mockupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #f0f0f0',
  },
  mockupBody: {
    display: 'flex',
    minHeight: 280,
  },
  mockupSidebar: {
    width: 90,
    borderRight: '1px solid #f0f0f0',
    padding: '10px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  mockupNavItem: {
    fontSize: 8,
    padding: '6px 8px',
    borderRadius: 5,
    color: '#6b7280',
    cursor: 'default',
  },
  mockupContent: {
    flex: 1,
    padding: '12px 14px',
  },
  mockupTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mockupUploadBtn: {
    background: '#6A39F5',
    color: '#fff',
    fontSize: 8,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 5,
  },
  mockupStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  mockupStat: {
    background: '#f9fafb',
    borderRadius: 6,
    padding: '8px 6px',
    textAlign: 'center',
    border: '1px solid #f0f0f0',
  },
  mockupActivity: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    borderBottom: '1px solid #f9fafb',
  },
  mockupThumb: {
    width: 28,
    height: 20,
    borderRadius: 3,
    background: 'linear-gradient(135deg, #EAE8FF 0%, #d4d0fb 100%)',
    flexShrink: 0,
  },
};

export default LandingPage;
