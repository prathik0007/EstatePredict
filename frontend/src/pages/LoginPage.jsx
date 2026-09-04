import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = location.state?.from;
  const redirectTarget = fromLocation
    ? (typeof fromLocation === 'string' ? fromLocation : ((fromLocation.pathname || '/') + (fromLocation.search || '')))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');

      // If user came from a protected feature/route, redirect there; otherwise use role default
      if (redirectTarget) {
        navigate(redirectTarget);
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="container" style={{ padding: '60px 1.5rem 80px', maxWidth: '480px' }}>
      <div className="card" style={{ padding: '36px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Building2 size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Sign in to manage listings, bookings, or explore verified homes
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontWeight: '700', marginTop: '8px' }}
          >
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Quick Demo Accounts (1-Click Fill)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('owner@rental.com', 'ownerpassword123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Owner Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('tenant@rental.com', 'tenantpassword123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Tenant Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@rental.com', 'adminpassword123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Admin Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account yet?{' '}
          <Link to="/register" state={{ from: location.state?.from }} style={{ color: '#3b82f6', fontWeight: '700' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
