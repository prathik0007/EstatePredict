import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Users, Sparkles, Heart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { usdToInr } from '../utils/currency';

const PropertyCard = ({ property, isWishlistedInitial = false, onWishlistToggle }) => {
  const { isAuthenticated, isTenant } = useAuth();
  const { showToast } = useNotification();
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Please log in to save properties to your wishlist.', 'info');
      return;
    }
    if (!isTenant) {
      showToast('Only tenant / guest accounts can save favorites.', 'info');
      return;
    }

    try {
      setLoadingWishlist(true);
      const res = await api.post('/wishlist/toggle', { propertyId: property._id });
      setIsWishlisted(res.data.isWishlisted);
      showToast(res.data.message, 'success');
      if (onWishlistToggle) onWishlistToggle(property._id, res.data.isWishlisted);
    } catch (err) {
      showToast('Failed to update wishlist', 'error');
    } finally {
      setLoadingWishlist(false);
    }
  };

  const mainImage = (property.images && property.images.length > 0)
    ? property.images[0]
    : '/datasets-images/image_0.jpg';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Property Image Box */}
      <div style={{ position: 'relative', height: '210px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
        <img
          src={mainImage}
          alt={property.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=60';
          }}
        />

        {/* City Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <span className="badge badge-primary" style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#1e293b', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
            <MapPin size={12} color="#3b82f6" /> {property.location?.city || 'Asheville'}, NC
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={loadingWishlist}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isWishlisted ? '#ef4444' : 'rgba(255, 255, 255, 0.9)',
            color: isWishlisted ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'var(--transition)'
          }}
          title={isWishlisted ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={18} fill={isWishlisted ? '#ffffff' : 'none'} />
        </button>

        {/* AI Valuation badge overlay if available */}
        {property.predictedRentInfo?.predictedRent && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a78bfa' }}>
              <Sparkles size={13} />
              <span>AI Predicted Rate</span>
            </div>
            <span style={{ color: '#34d399' }}>
              ₹{usdToInr(property.predictedRentInfo.predictedRent).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Property Details Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
              ${Number(property.price).toLocaleString('en-US')}
            </span>
          </div>
          <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
            {property.propertyType}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {property.title}
        </h3>

        {/* Address */}
        <p style={{
          fontSize: '0.825rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '16px'
        }}>
          <MapPin size={14} color="#94a3b8" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.location?.address}
          </span>
        </p>

        {/* Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '10px 0',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <BedDouble size={14} /> Beds
            </span>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{property.bedrooms || property.bhk || 2}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <Bath size={14} /> Baths
            </span>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{property.bathrooms || property.bathroom || 1.5}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <Users size={14} /> Guests
            </span>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{property.accommodates || 4}</span>
          </div>
        </div>

        {/* View Details Action */}
        <Link
          to={`/properties/${property._id}`}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: 'auto', textAlign: 'center', fontWeight: '700' }}
        >
          View Full Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
