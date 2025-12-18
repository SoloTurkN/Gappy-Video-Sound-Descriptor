import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Video, CheckCircle2, BarChart3, FileText, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Video size={28} color="#E91E8C" />,
      title: 'Smart Scene Detection',
      description: 'Gappy AI automatically detects scene changes and key moments in your video for precise audio descriptions.'
    },
    {
      icon: <Sparkles size={28} color="#00D4D4" />,
      title: 'AI-Powered Descriptions',
      description: 'Gappy AI generates WCAG 1.2.3 Level AA compliant audio descriptions that meet accessibility standards.'
    },
    {
      icon: <BarChart3 size={28} color="#6B5DD3" />,
      title: 'Easy Editing & Export',
      description: 'Review, edit, and export your videos in multiple formats (MP4, AVI, MOV) with embedded audio descriptions.'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => navigate('/')}>
            <img src="/gappy-logo1.png" alt="Gappy Describe" style={styles.logoText} />
          </div>
          <nav style={styles.nav}>
            <button onClick={() => navigate('/pricing')} style={{...styles.navLink, background: 'none', border: 'none', cursor: 'pointer'}}>Pricing</button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '10px 24px' }}>
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '10px 24px' }}>
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Make Your Videos Accessible with <span style={styles.highlight}>Gappy Describe.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Automatically generate WCAG-compliant audio descriptions for your videos.
            <br />
            Upload, analyze, and export in minutes.
          </p>
          <div style={styles.heroCta}>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Get Started Free
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className="card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Make Your Videos Accessible?</h2>
          <p style={styles.ctaSubtitle}>Join thousands of creators making their content accessible to everyone.</p>
          <button 
            onClick={() => navigate('/signup')} 
            className="btn-primary" 
            style={{ padding: '16px 40px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Start Free Today
            <ArrowRight size={20} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <img src="/gappy-labs-logo-white-text.png" alt="Gappy Labs" style={styles.footerLogo} />
            <p style={styles.footerText}>© 2025 All rights reserved.</p>
          </div>
          <div style={styles.footerLinks}>
            <button onClick={() => navigate('/privacy')} style={{...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer'}}>Privacy</button>
            <a href="#" style={styles.footerLink}>Terms</a>
            <a href="#" style={styles.footerLink}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'white',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    background: 'white',
    zIndex: 50,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  logoIcon: {
    height: '40px',
    width: 'auto',
  },
  logoText: {
    height: '32px',
    width: 'auto',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    fontSize: '16px',
    color: '#4a5568',
    textDecoration: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  hero: {
    padding: '80px 24px',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '800',
    lineHeight: '1.2',
    marginBottom: '24px',
    color: '#1a202c',
  },
  highlight: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    whiteSpace: 'nowrap',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#4a5568',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  heroCta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  featuresSection: {
    padding: '80px 24px',
    background: '#f7fafc',
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '48px',
    color: '#1a202c',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    padding: '32px',
    textAlign: 'center',
  },
  featureIcon: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1a202c',
  },
  featureDescription: {
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.6',
  },
  ctaSection: {
    padding: '80px 24px',
    background: 'white',
    color: '#1a202c',
    textAlign: 'center',
  },
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a202c',
  },
  ctaSubtitle: {
    fontSize: '20px',
    marginBottom: '32px',
    color: '#4a5568',
  },
  footer: {
    padding: '48px 24px',
    background: '#1a202c',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerLogo: {
    height: '28px',
    width: 'auto',
  },
  footerText: {
    color: '#a0aec0',
    fontSize: '14px',
    margin: 0,
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#a0aec0',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
};

export default LandingPage;
