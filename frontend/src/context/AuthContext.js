import React, { createContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSessionId = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to process session');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthenticated(true);
      return data.user;
    } catch (error) {
      console.error('Session processing error:', error);
      throw error;
    }
  };

  const signupWithEmail = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthenticated(true);
      return data.user;
    } catch (error) {
      console.error('Email signup error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthenticated(true);
      return data.user;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAuthenticated(false);
    }
  };

  const value = {
    user,
    authenticated,
    loading,
    processSessionId,
    signupWithEmail,
    loginWithEmail,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
