import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);
  const navigate = useNavigate();
  const { authenticated, processSessionId, loginWithEmail } = useAuth();

  // Check if user is already authenticated
  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  // Process session_id from URL fragment
  useEffect(() => {
    const handleSessionId = async () => {
      const fragment = window.location.hash;
      const sessionIdMatch = fragment.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        setProcessingSession(true);
        
        try {
          await processSessionId(sessionId);
          // Clean URL fragment
          window.history.replaceState(null, '', window.location.pathname);
          toast.success('Welcome to Gappy Descripe! 🎉');
          navigate('/dashboard');
        } catch (error) {
          toast.error('Authentication failed. Please try again.');
          setProcessingSession(false);
        }
      }
    };
    
    handleSessionId();
  }, [processSessionId, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await loginWithEmail(email, password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Redirect to Emergent Auth
    const redirectUrl = `${window.location.origin}/login`;
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  if (processingSession) {
    return (
      <div style={styles.container}>
        <div style={styles.content} className="fade-in">
          <div style={styles.logoSection}>
            <img src="/gappy-icon1.png" alt="Gappy" style={styles.logo} className="spin-icon" />
            <img src="/gappy-logo1.png" alt="Gappy Descripe" style={styles.logoText} />
          </div>
          <div className="glass-card" style={styles.loginCard}>
            <h2 style={styles.title}>Completing Sign In...</h2>
            <p style={styles.subtitle}>Please wait while we set up your account</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content} className="fade-in">
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div className="glass-card hover-lift" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Welcome Back!</h2>
            <p style={styles.subtitle}>Make your videos accessible with AI</p>
          </div>

          <form onSubmit={handleEmailLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Mail size={20} color="#FF6B9D" />
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...styles.input, paddingLeft: '50px' }}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Lock size={20} color="#FF6B9D" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingLeft: '50px' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                background: 'white',
                color: '#111827',
                border: '1px solid #e5e7eb',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                marginTop: '10px'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = '#f9fafb')}
              onMouseLeave={(e) => !loading && (e.target.style.background = 'white')}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/gappy-icon1.png" alt="Loading" style={{ width: '20px', height: '20px' }} className="spin-icon" />
                  Logging in...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <img src="/gappy-icon1.png" alt="Gappy" style={{ width: '20px', height: '20px' }} />
                  Login to Gappy Describe
                </div>
              )}
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerText}>OR</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn-secondary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </div>
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account? <a href="#" style={styles.link}>Start Free Trial</a>
            </p>
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
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  logoSection: {
    marginBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  logo: {
    width: '100px',
    height: '100px',
    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
  },
  logoText: {
    height: '50px',
    width: 'auto',
    filter: 'drop-shadow(0 4px 15px rgba(255, 255, 255, 0.5))',
  },
  loginCard: {
    marginBottom: '30px',
  },
  cardHeader: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
  },
  input: {
    width: '100%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    position: 'relative',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '600',
    padding: '0 16px',
    position: 'relative',
    '::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      background: '#e5e7eb',
      zIndex: -1,
    },
  },
  footer: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '2px solid #e0e7ff',
  },
  footerText: {
    fontSize: '14px',
    color: '#718096',
  },
  link: {
    color: '#FF6B9D',
    fontWeight: '600',
    textDecoration: 'none',
  },
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  featureDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#FFE66D',
    boxShadow: '0 0 10px #FFE66D',
  },
};

export default LoginPage;
