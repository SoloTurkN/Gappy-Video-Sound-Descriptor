import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const PricingPage = () => {
  const navigate = useNavigate();

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
        'All export formats (MP4, AVI, MOV)',
        'Advanced AI analysis',
        'Priority support',
        'Custom voice options',
        'Batch processing'
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
        'Team management',
        'Custom training',
        'White-label options'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img src="/gappy-logo1.png" alt="Gappy" style={styles.logo} onClick={() => navigate('/')} />
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '10px 20px' }}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            Back
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Choose Your Plan</h1>
          <p style={styles.subtitle}>
            Start free, upgrade when you need more. All plans include core features.
          </p>
        </div>

        <div style={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className="card" 
              style={{
                ...styles.pricingCard,
                ...(plan.highlighted ? styles.highlightedCard : {})
              }}
            >
              {plan.highlighted && (
                <div style={styles.popularBadge}>Most Popular</div>
              )}
              
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceSection}>
                <span style={styles.price}>{plan.price}</span>
                <span style={styles.period}>/{plan.period}</span>
              </div>
              <p style={styles.description}>{plan.description}</p>
              
              <ul style={styles.featureList}>
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} style={styles.featureItem}>
                    <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: '12px', flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => navigate('/signup')}
                className={plan.highlighted ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', padding: '14px', marginTop: '24px' }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={styles.faqSection}>
          <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
          <div style={styles.faqGrid}>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Can I change my plan later?</h4>
              <p style={styles.faqAnswer}>Yes, you can upgrade or downgrade your plan at any time.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>What payment methods do you accept?</h4>
              <p style={styles.faqAnswer}>We accept all major credit cards and PayPal.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Is there a free trial?</h4>
              <p style={styles.faqAnswer}>Yes, all plans include a 14-day free trial.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Do you offer refunds?</h4>
              <p style={styles.faqAnswer}>Yes, we offer a 30-day money-back guarantee.</p>
            </div>
          </div>
        </div>
      </div>
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
    cursor: 'pointer',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  title: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
  },
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginBottom: '80px',
  },
  pricingCard: {
    padding: '40px 32px',
    position: 'relative',
  },
  highlightedCard: {
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
  priceSection: {
    marginBottom: '8px',
  },
  price: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#111827',
  },
  period: {
    fontSize: '16px',
    color: '#6b7280',
  },
  description: {
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
  faqSection: {
    marginTop: '80px',
    paddingTop: '80px',
    borderTop: '1px solid #e5e7eb',
  },
  faqTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '48px',
  },
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
  },
  faqItem: {},
  faqQuestion: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  faqAnswer: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
};

export default PricingPage;
