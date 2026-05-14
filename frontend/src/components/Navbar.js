import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { authenticated, logout } = useAuth();

  return (
    <header style={styles.header} data-testid="global-navbar">
      <div style={styles.inner}>
        <div style={styles.logoWrap} onClick={() => navigate('/')}>
          <img src="/gappy-logo1.png" alt="Gappy Labs" style={styles.logo} />
        </div>
        <nav style={styles.nav}>
          <button onClick={() => navigate('/pricing')} style={styles.navLink} data-testid="nav-pricing">
            Pricing
          </button>
          {authenticated ? (
            <>
              <button onClick={() => navigate('/dashboard')} style={styles.navLink} data-testid="nav-dashboard">
                Dashboard
              </button>
              <button onClick={logout} style={styles.logoutBtn} data-testid="nav-logout">
                <LogOut size={16} style={{ marginRight: 6 }} />
                Log Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={styles.loginBtn} data-testid="nav-login">
                Login
              </button>
              <button onClick={() => navigate('/signup')} style={styles.signupBtn} data-testid="nav-signup">
                Sign Up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    borderBottom: '1px solid #f0f0f0',
    background: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrap: { cursor: 'pointer' },
  logo: { height: 32, objectFit: 'contain' },
  nav: { display: 'flex', alignItems: 'center', gap: 10 },
  navLink: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    padding: '8px 14px',
    fontFamily: "'Inter', sans-serif",
    borderRadius: 6,
  },
  loginBtn: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    padding: '8px 20px',
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
  },
  signupBtn: {
    background: '#6A39F5',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    padding: '8px 20px',
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: '1px solid #e5e7eb',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
  },
};

export default Navbar;
