import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login (replace with actual API call)
    setTimeout(() => {
      if (email && password) {
        toast.success('Welcome to Gappy Descripe! 🎉');
        onLogin();
        navigate('/');
      } else {
        toast.error('Please enter email and password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={styles.container}>
      {/* Decorative Background Blobs */}
      <div className="decorative-blob" style={{ top: '5%', left: '5%', width: '500px', height: '500px', background: '#FF6B9D' }}></div>
      <div className="decorative-blob" style={{ bottom: '10%', right: '10%', width: '600px', height: '600px', background: '#4ECDC4', animationDelay: '7s' }}></div>
      <div className="decorative-blob" style={{ top: '40%', right: '15%', width: '400px', height: '400px', background: '#FFE66D', animationDelay: '14s' }}></div>

      <div style={styles.content} className="fade-in">
        {/* Logo and Branding */}
        <div style={styles.logoSection} className="bounce">
          <img src="/gappy-icon.png" alt="Gappy" style={styles.logo} />
          <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logoText} />
        </div>

        {/* Login Card */}
        <div className="glass-card hover-lift" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Welcome Back!</h2>
            <p style={styles.subtitle}>Make your videos accessible with AI ✨</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
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
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <img src="/gappy-icon.png" alt="Loading" style={{ width: '24px', height: '24px' }} className="spin-icon" />
                  Logging in...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Sparkles size={20} />
                  Login to Gappy
                </div>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account? <a href="#" style={styles.link}>Start Free Trial</a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureDot}></div>
            <span>WCAG Compliant</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureDot}></div>
            <span>AI-Powered</span>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureDot}></div>
            <span>Fast Export</span>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center',
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
