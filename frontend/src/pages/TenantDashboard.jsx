import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  User,
  Heart,
  Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

const TenantDashboard = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotification();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.error('Error fetching tenant bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', { name, phone });
      if (res.data.success) {
        updateUser(res.data.user);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontWeight: '600' }}>
        Loading Guest Dashboard...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 1.5rem 80px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
            Guest / Tenant Account
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
            My Bookings & Inquiries
          </h1>
        </div>
        <Link to="/tenant/wishlist" className="btn btn-secondary">
          <Heart size={16} color="#ef4444" /> View Saved Favorites
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '32px' }}>
        {/* Bookings Tracker List */}
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            Stay & Visit Requests ({bookings.length})
          </h3>

          {bookings.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <CalendarCheck size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>No visit requests yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '6px 0 20px' }}>
                Browse Asheville properties and schedule stay requests directly with verified hosts.
              </p>
              <Link to="/properties" className="btn btn-primary btn-sm">
                Explore Properties
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map((booking) => (
                <div key={booking._id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <img
                        src={(booking.property?.images && booking.property.images[0]) || '/datasets-images/image_0.jpg'}
                        alt=""
                        style={{ width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'; }}
                      />
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                          {booking.property?.title || 'Property Listing'}
                        </h4>
                        <p style={{ fontSize: '0.825rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={13} /> {booking.property?.location?.city || 'Asheville'} • ${Number(booking.property?.price).toLocaleString('en-US')}/night
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '8px' }}>
                          📅 <strong>Requested Date:</strong> {new Date(booking.visitDate).toLocaleDateString()} ({booking.timeSlot})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          Host Contact: {booking.owner?.name} ({booking.owner?.email})
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${booking.status === 'accepted' ? 'badge-success' : (booking.status === 'rejected' ? 'badge-danger' : 'badge-warning')}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                        {booking.status === 'accepted' && <CheckCircle size={14} />}
                        {booking.status === 'rejected' && <XCircle size={14} />}
                        {booking.status === 'pending' && <AlertCircle size={14} />}
                        {booking.status.toUpperCase()}
                      </span>
                      {booking.property?._id && (
                        <div style={{ marginTop: '12px' }}>
                          <Link to={`/properties/${booking.property._id}`} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> View Property
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#3b82f6" /> My Profile
            </h3>

            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="form-input"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (828) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', fontWeight: '700' }}
              >
                {profileSaving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
