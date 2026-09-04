import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Building2,
  Sparkles,
  PlusCircle,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  CalendarCheck,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isOwner, isTenant, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Estate<span style={{ color: '#3b82f6' }}>Predict</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Multimodal ML Rental Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="desktop-nav">
          <Link to="/properties" style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
            Explore Properties
          </Link>
          {isAuthenticated && (
            <Link to="/estimator" style={{
              fontWeight: '700',
              color: '#6d28d9',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #c4b5fd'
            }}>
              <Sparkles size={16} color="#7c3aed" /> AI Rent Estimator
            </Link>
          )}
          {isOwner && (
            <Link to="/add-property" className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> List Property
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <div ref={notificationRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    position: 'relative',
                    color: '#334155'
                  }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popup */}
                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '340px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-color)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => markAsRead(notif._id)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              background: notif.read ? '#ffffff' : '#f0fdf4',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontWeight: '600', fontSize: '0.825rem', color: '#0f172a' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '2px' }}>{notif.message}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: '30px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.8rem'
                  }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : (user?.role === 'owner' ? 'badge-primary' : 'badge-success')}`} style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </span>
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '220px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-color)',
                    zIndex: 200,
                    padding: '8px'
                  }}>
                    {isOwner && (
                      <Link
                        to="/owner/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '0.875rem', fontWeight: '600', color: '#334155', borderRadius: '8px' }}
                      >
                        <LayoutDashboard size={16} /> Owner Dashboard
                      </Link>
                    )}
                    {isTenant && (
                      <>
                        <Link
                          to="/tenant/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '0.875rem', fontWeight: '600', color: '#334155', borderRadius: '8px' }}
                        >
                          <CalendarCheck size={16} /> My Bookings
                        </Link>
                        <Link
                          to="/tenant/wishlist"
                          onClick={() => setShowUserMenu(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '0.875rem', fontWeight: '600', color: '#334155', borderRadius: '8px' }}
                        >
                          <Heart size={16} /> My Favorites
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '0.875rem', fontWeight: '600', color: '#991b1b', borderRadius: '8px' }}
                      >
                        <ShieldCheck size={16} /> Admin Portal
                      </Link>
                    )}
                    <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
