import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (name && email && password) {
        toast.success('Account created successfully!');
        onSignup();
        navigate('/dashboard');
      } else {
        toast.error('Please fill all fields');
      }
      setLoading(false);
    }, 1000);
  };

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
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <User size={20} color="#6b7280" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...styles.input, paddingLeft: '48px' }}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Mail size={20} color="#6b7280" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...styles.input, paddingLeft: '48px' }}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Lock size={20} color="#6b7280" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingLeft: '48px' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <img src="/gappy-icon.png" alt="" style={{ width: '20px', height: '20px' }} className="spin-icon" />
                  Creating Account...
                </>
              ) : (
                <>
                  Get Started Free
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
