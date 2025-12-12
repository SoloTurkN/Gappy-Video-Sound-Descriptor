import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useContext(AuthContext);
  
  const [status, setStatus] = useState('checking'); // checking, success, error, expired
  const [message, setMessage] = useState('Verifying your payment...');
  const [tier, setTier] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid payment session. Please try again.');
      return;
    }

    pollPaymentStatus(sessionId);
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId) => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      setMessage('Payment verification timed out. Please contact support if you were charged.');
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/payments/status/${sessionId}`,
        { withCredentials: true }
      );

      const data = response.data;

      if (data.payment_status === 'paid') {
        setStatus('success');
        setMessage(data.message || 'Payment successful!');
        setTier(data.tier);
        toast.success('Payment successful!');
        
        // Refresh user context to update subscription tier
        if (refreshUser) {
          await refreshUser();
        }
      } else if (data.status === 'expired') {
        setStatus('expired');
        setMessage('Payment session expired. Please try again.');
      } else {
        // Still pending, poll again
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      if (error.response?.status === 401) {
        // User not logged in
        setStatus('error');
        setMessage('Please log in to verify your payment.');
      } else if (error.response?.status === 404) {
        setStatus('error');
        setMessage('Payment session not found. Please contact support.');
      } else {
        // Retry on network errors
        setAttempts(prev => prev + 1);
        if (attempts < maxAttempts - 1) {
          setTimeout(() => pollPaymentStatus(sessionId), 2000);
        } else {
          setStatus('error');
          setMessage('Unable to verify payment. Please contact support.');
        }
      }
    }
  };

  const getTierDisplay = () => {
    if (!tier) return '';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img 
            src="/gappy-logo1.png" 
            alt="Gappy" 
            style={styles.logo} 
            onClick={() => navigate('/')} 
          />
        </div>
      </nav>

      <div style={styles.content}>
        <div className="card" style={styles.card}>
          {status === 'checking' && (
            <>
              <div style={styles.iconContainer}>
                <Loader2 size={64} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <h1 style={styles.title}>Processing Payment</h1>
              <p style={styles.message}>{message}</p>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(attempts / maxAttempts) * 100}%`
                  }} 
                />
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={styles.iconContainer}>
                <CheckCircle size={64} color="#10b981" />
              </div>
              <h1 style={styles.title}>Payment Successful!</h1>
              <p style={styles.message}>{message}</p>
              {tier && (
                <div style={styles.tierBadge}>
                  {getTierDisplay()} Plan Activated
                </div>
              )}
              <div style={styles.features}>
                <p style={styles.featuresTitle}>You now have access to:</p>
                <ul style={styles.featureList}>
                  {tier === 'pro' && (
                    <>
                      <li>✓ 50 videos per month</li>
                      <li>✓ Unlimited video duration</li>
                      <li>✓ All export formats (MP4, AVI, MOV)</li>
                      <li>✓ High-quality ElevenLabs voices</li>
                    </>
                  )}
                  {tier === 'enterprise' && (
                    <>
                      <li>✓ Unlimited videos</li>
                      <li>✓ API access</li>
                      <li>✓ Priority support</li>
                      <li>✓ Custom integrations</li>
                    </>
                  )}
                </ul>
              </div>
              <button
                onClick={() => navigate('/home')}
                className="btn-primary"
                style={styles.ctaButton}
              >
                Start Creating
                <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={styles.iconContainer}>
                <XCircle size={64} color="#ef4444" />
              </div>
              <h1 style={styles.title}>Payment Issue</h1>
              <p style={styles.message}>{message}</p>
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => navigate('/pricing')}
                  className="btn-primary"
                  style={styles.ctaButton}
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="btn-secondary"
                  style={styles.secondaryButton}
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}

          {status === 'expired' && (
            <>
              <div style={styles.iconContainer}>
                <XCircle size={64} color="#f59e0b" />
              </div>
              <h1 style={styles.title}>Session Expired</h1>
              <p style={styles.message}>{message}</p>
              <button
                onClick={() => navigate('/pricing')}
                className="btn-primary"
                style={styles.ctaButton}
              >
                View Plans
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: '36px',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '60px 24px',
  },
  card: {
    padding: '48px',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '12px',
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#667eea',
    transition: 'width 0.3s ease',
  },
  tierBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '8px 24px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '32px',
  },
  features: {
    textAlign: 'left',
    background: '#f9fafb',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '32px',
  },
  featuresTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '2',
  },
  ctaButton: {
    padding: '14px 32px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    padding: '14px 24px',
  },
};

export default PaymentSuccessPage;
