import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  CalendarCheck,
  Check,
  X,
  Trash2,
  Edit,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Home
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

const OwnerDashboard = () => {
  const { showToast } = useNotification();

  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'requests'

  const fetchData = async () => {
    try {
      const [propsRes, reqsRes] = await Promise.all([
        api.get('/properties/my-listings'),
        api.get('/bookings/owner-requests')
      ]);

      if (propsRes.data.success) setProperties(propsRes.data.properties);
      if (reqsRes.data.success) setRequests(reqsRes.data.bookings);
    } catch (err) {
      console.error('Error fetching owner dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        showToast(`Booking marked as ${status}`, 'success');
        setRequests(prev =>
          prev.map(r => r._id === bookingId ? { ...r, status } : r)
        );
      }
    } catch (err) {
      showToast('Error updating booking status', 'error');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await api.delete(`/properties/${propertyId}`);
      if (res.data.success) {
        showToast('Property deleted successfully', 'success');
        setProperties(prev => prev.filter(p => p._id !== propertyId));
      }
    } catch (err) {
      showToast('Error deleting property', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontWeight: '600' }}>
        Loading Host Dashboard...
      </div>
    );
  }

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="container" style={{ padding: '36px 1.5rem 80px' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>
            Host Portal
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
            Host Dashboard
          </h1>
        </div>
        <Link to="/add-property" className="btn btn-primary">
          <PlusCircle size={18} /> Add New Listing
        </Link>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Total Properties Listed</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{properties.length}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Pending Inquiries</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>{pendingRequestsCount}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Total Inquiries Received</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>{requests.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'listings' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'listings' ? '#3b82f6' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          My Properties ({properties.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'requests' ? '#3b82f6' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Stay / Visit Inquiries ({requests.length})
          {pendingRequestsCount > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Listings */}
      {activeTab === 'listings' && (
        <div>
          {properties.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <Home size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>No property listings yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '6px 0 20px' }}>
                List your first Asheville rental property and leverage our Multimodal V3 model for rental price valuation.
              </p>
              <Link to="/add-property" className="btn btn-primary btn-sm">
                <PlusCircle size={16} /> Add Property
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {properties.map((prop) => (
                <div key={prop._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={(prop.images && prop.images[0]) || '/datasets-images/image_0.jpg'}
                      alt=""
                      style={{ width: '90px', height: '65px', borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'; }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>{prop.title}</h4>
                      <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>
                        {prop.location?.city || 'Asheville'} • {prop.bedrooms || prop.bhk || 2} Beds • {prop.bathrooms || prop.bathroom || 1} Baths • {prop.propertyType}
                      </p>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
                        ${Number(prop.price).toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link to={`/properties/${prop._id}`} className="btn btn-secondary btn-sm" title="View Listing">
                      <Eye size={15} /> View
                    </Link>
                    <button
                      onClick={() => handleDeleteProperty(prop._id)}
                      className="btn btn-danger btn-sm"
                      title="Delete Listing"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Visit Requests */}
      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              No inquiries received yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {requests.map((req) => (
                <div key={req._id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                          {req.tenant?.name || 'Prospective Guest'}
                        </h4>
                        <span className={`badge ${req.status === 'accepted' ? 'badge-success' : (req.status === 'rejected' ? 'badge-danger' : 'badge-warning')}`}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600', marginTop: '2px' }}>
                        Property: {req.property?.title}
                      </p>
                      <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '6px' }}>
                        📅 <strong>Date:</strong> {new Date(req.visitDate).toLocaleDateString()} ({req.timeSlot})
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                        📞 <strong>Contact:</strong> {req.contactNumber} • ✉️ {req.tenant?.email}
                      </div>
                      {req.message && (
                        <p style={{ fontSize: '0.825rem', color: '#64748b', fontStyle: 'italic', marginTop: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'accepted')}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#10b981' }}
                        >
                          <Check size={16} /> Accept Request
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'rejected')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444' }}
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
