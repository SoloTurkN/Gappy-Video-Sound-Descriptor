import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Video, CheckCircle2, BarChart3, FileText, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Video size={28} color="#FF6B9D" />,
      title: 'Smart Scene Detection',
      description: 'AI automatically detects scene changes and key moments in your video for precise audio descriptions.'
    },
    {
      icon: <Sparkles size={28} color="#4ECDC4" />,
      title: 'AI-Powered Descriptions',
      description: 'GPT-4o generates WCAG 1.2.3 Level A compliant audio descriptions that meet accessibility standards.'
    },
    {
      icon: <BarChart3 size={28} color="#667eea" />,
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
            Make Your Videos <span style={styles.highlight}>Accessible</span> with Gappy Describe.
          </h1>
          <p style={styles.heroSubtitle}>
            Automatically generate WCAG-compliant audio descriptions for your videos.
            <br />
            Upload, analyze, and export in minutes.
          </p>
          <div style={styles.heroCta}>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
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
            style={{ padding: '16px 40px', fontSize: '18px' }}
          >
            Start Free Today
            <ArrowRight size={20} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>© 2025 Gappy Labs. All rights reserved.</p>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>Privacy</a>
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
    color: '#E91E8C',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#718096',
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
    color: '#718096',
    lineHeight: '1.6',
  },
  ctaSection: {
    padding: '80px 24px',
    background: 'linear-gradient(135deg, #6B5DD3 0%, #E91E8C 50%, #00D4D4 100%)',
    color: 'white',
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
  },
  ctaSubtitle: {
    fontSize: '20px',
    marginBottom: '32px',
    opacity: 0.9,
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    padding: '32px 24px',
    background: 'white',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#718096',
    fontSize: '14px',
    textDecoration: 'none',
  },
};

export default LandingPage;
