import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, UserPlus, Lock, Mail, User, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('tenant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
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
      const user = await register({ name, email, password, phone, role });
      showToast(`Account created successfully! Welcome, ${user.name}`, 'success');

      if (redirectTarget) {
        navigate(redirectTarget);
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '50px 1.5rem 80px', maxWidth: '500px' }}>
      <div className="card" style={{ padding: '36px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            Create Your Account
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Join our platform to rent or list verified properties
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
          {/* Role selector pill */}
          <div className="form-group">
            <label className="form-label">I want to register as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRole('tenant')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: role === 'tenant' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  background: role === 'tenant' ? '#eff6ff' : '#ffffff',
                  color: role === 'tenant' ? '#1d4ed8' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                🏠 Tenant / Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: role === 'owner' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  background: role === 'owner' ? '#eff6ff' : '#ffffff',
                  color: role === 'owner' ? '#1d4ed8' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                🏢 Property Owner
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

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
            <label className="form-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
              <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                minLength={6}
                required
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontWeight: '700', marginTop: '10px' }}
          >
            <UserPlus size={18} /> {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" state={{ from: location.state?.from }} style={{ color: '#3b82f6', fontWeight: '700' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
