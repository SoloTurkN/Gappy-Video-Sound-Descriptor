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

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Gappy',
      features: [
        '3 videos per month',
        'Up to 5 minutes each',
        'MP4 export only',
        'Basic scene detection',
        'Community support'
      ],
      cta: 'Get Started Free',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For content creators & educators',
      features: [
        '50 videos per month',
        'Unlimited video length',
        'All export formats',
        'Advanced AI analysis',
        'Priority support',
        'Custom voice options'
      ],
      cta: 'Start Pro Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For organizations & teams',
      features: [
        'Unlimited videos',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'Team management'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logo} />
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ marginRight: '12px', padding: '10px 24px' }}>Log In</button>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '10px 24px' }}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div className="badge" style={{ marginBottom: '24px' }}>
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            WCAG 1.2.3 Level A Compliant
          </div>
          
          <h1 style={styles.heroTitle}>
            Make Your Videos Accessible<br />with <span style={{ color: '#667eea' }}>AI-Powered</span> Audio Descriptions
          </h1>
          
          <p style={styles.heroSubtitle}>
            Gappy automatically generates WCAG-compliant audio descriptions for your videos.
            Upload, analyze, and export accessible content in minutes.
          </p>

          <div style={styles.heroButtons}>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Get Started Free
            </button>
            <button onClick={() => navigate('/pricing')} className="btn-secondary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Everything You Need for Video Accessibility</h2>
          <p style={styles.sectionSubtitle}>Comprehensive tools to analyze, describe, and export WCAG-compliant videos.</p>
          
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className="card" style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  {feature.icon}
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureText}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={styles.pricingSection}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Choose Your Plan</h2>
          <p style={styles.sectionSubtitle}>Start free, upgrade when you need more. All plans include core features.</p>
          
          <div style={styles.pricingGrid}>
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className="card" 
                style={{
                  ...styles.pricingCard,
                  ...(plan.highlighted ? styles.pricingCardHighlighted : {})
                }}
              >
                {plan.highlighted && (
                  <div style={styles.popularBadge}>Most Popular</div>
                )}
                <h3 style={styles.planName}>{plan.name}</h3>
                <div style={styles.planPrice}>
                  <span style={styles.priceAmount}>{plan.price}</span>
                  <span style={styles.pricePeriod}>/{plan.period}</span>
                </div>
                <p style={styles.planDescription}>{plan.description}</p>
                
                <ul style={styles.featureList}>
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} style={styles.featureItem}>
                      <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: '12px', flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => navigate(plan.name === 'Enterprise' ? '/signup' : '/signup')}
                  className={plan.highlighted ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', padding: '14px', marginTop: '24px' }}
                >
                  {plan.cta}
                </button>
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
          <p style={styles.footerText}>© 2024 Gappy Descripe. All rights reserved.</p>
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
    background: '#ffffff',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    height: '36px',
    width: 'auto',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    color: '#111827',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '15px',
  },
  hero: {
    padding: '100px 24px 80px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
  },
  heroContent: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: '800',
    color: '#111827',
    marginBottom: '24px',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#6b7280',
    marginBottom: '40px',
    lineHeight: '1.6',
    maxWidth: '700px',
    margin: '0 auto 40px',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  featuresSection: {
    padding: '100px 24px',
    background: '#ffffff',
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '16px',
    letterSpacing: '-0.01em',
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '60px',
    maxWidth: '700px',
    margin: '0 auto 60px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    padding: '40px 32px',
    textAlign: 'center',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 24px',
    background: '#f9fafb',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e5e7eb',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '12px',
  },
  featureText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  pricingSection: {
    padding: '100px 24px',
    background: '#f9fafb',
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pricingCard: {
    padding: '40px 32px',
    position: 'relative',
  },
  pricingCardHighlighted: {
    border: '2px solid #667eea',
    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.15)',
  },
  popularBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#667eea',
    color: 'white',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  planName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
  },
  planPrice: {
    marginBottom: '8px',
  },
  priceAmount: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#111827',
  },
  pricePeriod: {
    fontSize: '16px',
    color: '#6b7280',
  },
  planDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '32px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#111827',
    marginBottom: '12px',
  },
  ctaSection: {
    padding: '100px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textAlign: 'center',
  },
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '16px',
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '32px',
  },
  footer: {
    padding: '40px 24px',
    background: '#111827',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  footerText: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '32px',
  },
  footerLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '14px',
  },
};

export default LandingPage;
