import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building,
  CalendarCheck,
  Check,
  X,
  Star,
  Eye,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { showToast } = useNotification();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'properties', 'users'

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, propsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/properties?limit=50')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsersList(usersRes.data.users);
      if (propsRes.data.success) setProperties(propsRes.data.properties);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleModerateProperty = async (propId, status) => {
    try {
      const res = await api.put(`/admin/properties/${propId}/status`, { status });
      if (res.data.success) {
        showToast(`Listing status updated to ${status}`, 'success');
        setProperties(prev =>
          prev.map(p => p._id === propId ? { ...p, status } : p)
        );
      }
    } catch (err) {
      showToast('Error updating listing status', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', fontWeight: '600' }}>
        Loading Admin Management System...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 1.5rem 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }}>
            System Administrator
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
            Platform Administration & Analytics
          </h1>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: '600' }}>Total Registered Users</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
            {stats?.users?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {stats?.users?.owners} Hosts • {stats?.users?.tenants} Guests
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: '600' }}>Active Property Listings</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
            {stats?.properties?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {stats?.properties?.available} Available
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: '600' }}>Total Inquiries & Visits</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
            {stats?.bookings?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            {stats?.bookings?.accepted} Accepted
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ color: '#64748b', fontSize: '0.825rem', fontWeight: '600' }}>Guest Reviews</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
            {stats?.reviews || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid #dc2626' : '3px solid transparent',
            color: activeTab === 'overview' ? '#dc2626' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          Neighborhood Analytics
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'properties' ? '3px solid #dc2626' : '3px solid transparent',
            color: activeTab === 'properties' ? '#dc2626' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          Listing Moderation ({properties.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #dc2626' : '3px solid transparent',
            color: activeTab === 'users' ? '#dc2626' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          Manage Users ({usersList.length})
        </button>
      </div>

      {/* Tab 1: Neighborhood Analytics */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#3b82f6" /> Neighborhood-Wise Market Distribution (Asheville, NC)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Neighborhood</th>
                  <th style={{ padding: '12px' }}>Active Listings</th>
                  <th style={{ padding: '12px' }}>Average Nightly Price</th>
                </tr>
              </thead>
              <tbody>
                {stats?.cityStats?.map((city) => (
                  <tr key={city._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{city._id}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-primary">{city.count} properties</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#2563eb' }}>
                      ${Math.round(city.avgPrice || 0).toLocaleString('en-US')}/night
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Properties Moderation */}
      {activeTab === 'properties' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            Property Listings Management
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Property</th>
                  <th style={{ padding: '12px' }}>Neighborhood</th>
                  <th style={{ padding: '12px' }}>Nightly Price</th>
                  <th style={{ padding: '12px' }}>Host</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a', maxWidth: '240px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prop.title}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{prop.location?.city || 'Asheville'}</td>
                    <td style={{ padding: '12px', fontWeight: '700' }}>${Number(prop.price).toLocaleString('en-US')}/night</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{prop.owner?.name || 'Host'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${prop.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                        {prop.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Link to={`/properties/${prop._id}`} className="btn btn-secondary btn-sm" title="View">
                          <Eye size={14} />
                        </Link>
                        {prop.status !== 'available' && (
                          <button
                            onClick={() => handleModerateProperty(prop._id, 'available')}
                            className="btn btn-primary btn-sm"
                            style={{ background: '#10b981' }}
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {prop.status === 'available' && (
                          <button
                            onClick={() => handleModerateProperty(prop._id, 'rejected')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444' }}
                            title="Deactivate / Reject"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            Registered Users Directory
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Phone</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{u.name}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{u.phone || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : (u.role === 'owner' ? 'badge-primary' : 'badge-success')}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
