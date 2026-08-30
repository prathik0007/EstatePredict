import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Home } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import api from '../services/api';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleWishlistToggle = (propId, isWishlisted) => {
    if (!isWishlisted) {
      setWishlist(prev => prev.filter(p => p._id !== propId));
    }
  };

  return (
    <div className="container" style={{ padding: '36px 1.5rem 80px' }}>
      <Link to="/properties" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Explore More Properties
      </Link>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={28} color="#ef4444" fill="#ef4444" /> My Favorite Properties
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Quickly access your saved rental listings
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: '600' }}>
          Loading saved properties...
        </div>
      ) : wishlist.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Home size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>No favorites saved yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '6px 0 20px' }}>
            Click the heart icon on any property card to save it here for fast access.
          </p>
          <Link to="/properties" className="btn btn-primary btn-sm">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid-properties">
          {wishlist.map((prop) => (
            <PropertyCard
              key={prop._id}
              property={prop}
              isWishlistedInitial={true}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
