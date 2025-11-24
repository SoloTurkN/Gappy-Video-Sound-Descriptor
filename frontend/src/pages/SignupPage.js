import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);
  const navigate = useNavigate();
  const { authenticated, processSessionId } = useAuth();

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
          toast.success('Account created successfully! Welcome to Gappy! 🎉');
          navigate('/dashboard');
        } catch (error) {
          toast.error('Sign up failed. Please try again.');
          setProcessingSession(false);
        }
      }
    };
    
    handleSessionId();
  }, [processSessionId, navigate]);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Redirect to Emergent Auth
    const redirectUrl = `${window.location.origin}/signup`;
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  if (processingSession) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.logoSection}>
            <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logo} className="spin-icon" />
          </div>
          <div className="card" style={styles.signupCard}>
            <h2 style={styles.title}>Setting Up Your Account...</h2>
            <p style={styles.subtitle}>Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logoSection}>
          <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logo} />
        </div>

        <div className="card" style={styles.signupCard}>
          <h2 style={styles.title}>Create Your Account</h2>
          <p style={styles.subtitle}>Start making your videos accessible today</p>

          <form onSubmit={handleSignup} style={styles.form}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <img src="/gappy-icon.png" alt="" style={{ width: '20px', height: '20px' }} className="spin-icon" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Sign up with Google
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <a href="/login" style={styles.link}>Log in</a>
            </p>
          </div>
        </div>

        <p style={styles.terms}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f9fafb',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    height: '40px',
    width: 'auto',
  },
  signupCard: {
    padding: '40px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '32px',
    textAlign: 'center',
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
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
  },
  input: {
    width: '100%',
  },
  footer: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  link: {
    color: '#FF6B9D',
    fontWeight: '600',
    textDecoration: 'none',
  },
  terms: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
  },
};

export default SignupPage;
