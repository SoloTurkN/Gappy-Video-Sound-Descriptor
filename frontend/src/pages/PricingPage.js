import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for trying out Gappy',
      features: [
        '3 videos per month',
        'Up to 5 minutes each',
        'MP4 export only',
        'Basic scene detection',
        'Community support'
      ],
      tier: 'free',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      description: 'For content creators & educators',
      features: [
        '50 videos per month',
        'Unlimited video length',
        'All export formats (MP4, AVI, MOV)',
        'High-quality ElevenLabs voices',
        'Priority processing',
        'Email support'
      ],
      tier: 'pro',
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      description: 'For organizations & teams',
      features: [
        'Unlimited videos',
        'API access',
        'Custom integrations',
        'Priority support',
        'SLA guarantee',
        'Team management',
        'Canvas LMS integration'
      ],
      tier: 'enterprise',
      highlighted: false
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user) {
      toast.info('Please sign up or login first');
      navigate('/signup');
      return;
    }

    if (plan.tier === 'free') {
      toast.info('You already have the Free plan');
      return;
    }

    // Check if user already has this tier
    if (user.subscription_tier === plan.tier) {
      toast.info(`You already have the ${plan.name} plan`);
      return;
    }

    if (user.subscription_tier === 'enterprise' && plan.tier === 'pro') {
      toast.info('You already have a higher tier subscription');
      return;
    }

    setLoading(plan.id);

    try {
      const packageId = `${plan.id}_${billingPeriod}`;
      const originUrl = window.location.origin;

      const response = await axios.post(
        `${BACKEND_URL}/api/payments/checkout`,
        { package_id: packageId, origin_url: originUrl },
        { withCredentials: true }
      );

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error.response?.data?.detail || 'Failed to start checkout';
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan) => {
    if (plan.id === 'free') return '$0';
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return `$${price.toFixed(2)}`;
  };

  const getPeriod = (plan) => {
    if (plan.id === 'free') return 'forever';
    return billingPeriod === 'monthly' ? 'per month' : 'per year';
  };

  const getButtonText = (plan) => {
    if (!user) return plan.id === 'free' ? 'Get Started Free' : `Get ${plan.name}`;
    
    if (user.subscription_tier === plan.tier) return 'Current Plan';
    if (plan.tier === 'free') return 'Free Plan';
    if (user.subscription_tier === 'enterprise' && plan.tier === 'pro') return 'Downgrade';
    
    return `Upgrade to ${plan.name}`;
  };

  const isCurrentPlan = (plan) => {
    return user?.subscription_tier === plan.tier;
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img src="/gappy-logo1.png" alt="Gappy" style={styles.logo} onClick={() => navigate('/')} />
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '10px 20px' }}>
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
          
          {/* Billing Toggle */}
          <div style={styles.billingToggle}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={{
                ...styles.toggleButton,
                ...(billingPeriod === 'monthly' ? styles.toggleActive : {})
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              style={{
                ...styles.toggleButton,
                ...(billingPeriod === 'yearly' ? styles.toggleActive : {})
              }}
            >
              Yearly
              <span style={styles.saveBadge}>Save 17%</span>
            </button>
          </div>
        </div>

        <div style={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className="card" 
              style={{
                ...styles.pricingCard,
                ...(plan.highlighted ? styles.highlightedCard : {}),
                ...(isCurrentPlan(plan) ? styles.currentPlanCard : {})
              }}
            >
              {plan.highlighted && !isCurrentPlan(plan) && (
                <div style={styles.popularBadge}>Most Popular</div>
              )}
              {isCurrentPlan(plan) && (
                <div style={styles.currentBadge}>Your Plan</div>
              )}
              
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceSection}>
                <span style={styles.price}>{getPrice(plan)}</span>
                <span style={styles.period}>/{getPeriod(plan)}</span>
              </div>
              {billingPeriod === 'yearly' && plan.id !== 'free' && (
                <p style={styles.yearlyNote}>
                  (${(plan.yearlyPrice / 12).toFixed(2)}/month, billed annually)
                </p>
              )}
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
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id || isCurrentPlan(plan)}
                className={plan.highlighted && !isCurrentPlan(plan) ? 'btn-primary' : 'btn-secondary'}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  marginTop: '24px',
                  opacity: isCurrentPlan(plan) ? 0.6 : 1,
                  cursor: isCurrentPlan(plan) ? 'default' : 'pointer'
                }}
              >
                {loading === plan.id ? (
                  <Loader2 size={20} className="spinner" style={{ margin: '0 auto' }} />
                ) : (
                  getButtonText(plan)
                )}
              </button>
            </div>
          ))}
        </div>

        <div style={styles.faqSection}>
          <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
          <div style={styles.faqGrid}>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Can I change my plan later?</h4>
              <p style={styles.faqAnswer}>Yes, you can upgrade your plan at any time. Your new features will be available immediately.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>What payment methods do you accept?</h4>
              <p style={styles.faqAnswer}>We accept all major credit cards through our secure Stripe payment system.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Is my payment secure?</h4>
              <p style={styles.faqAnswer}>Yes, all payments are processed securely through Stripe. We never store your card details.</p>
            </div>
            <div style={styles.faqItem}>
              <h4 style={styles.faqQuestion}>Do you offer refunds?</h4>
              <p style={styles.faqAnswer}>Yes, we offer a 30-day money-back guarantee if you're not satisfied.</p>
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
    marginBottom: '32px',
  },
  billingToggle: {
    display: 'inline-flex',
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
  },
  toggleButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'white',
    color: '#111827',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  saveBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
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
  currentPlanCard: {
    border: '2px solid #4ECDC4',
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
  currentBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#4ECDC4',
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
    marginBottom: '4px',
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
  yearlyNote: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
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
