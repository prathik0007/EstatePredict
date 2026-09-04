import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  Star,
  MessageSquare,
  Heart,
  Share2,
  ArrowLeft,
  Users
} from 'lucide-react';
import MapViewer from '../components/MapViewer';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { usdToInr, USD_TO_INR_RATE } from '../utils/currency';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isTenant } = useAuth();
  const { showToast } = useNotification();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [bookingMessage, setBookingMessage] = useState('I am interested in reserving / touring this property.');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchPropertyData = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      if (res.data.success) {
        setProperty(res.data.property);
      }

      // Fetch Reviews
      const reviewRes = await api.get(`/reviews/property/${id}`);
      if (reviewRes.data.success) {
        setReviews(reviewRes.data.reviews);
        setAvgRating(reviewRes.data.avgRating);
      }
    } catch (err) {
      console.error('Error fetching property details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to book a site visit.', 'info');
      return;
    }
    if (!isTenant) {
      showToast('Only tenant / guest accounts can submit booking requests.', 'error');
      return;
    }
    if (!visitDate) {
      showToast('Please select your preferred visit date.', 'error');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        propertyId: property._id,
        visitDate,
        timeSlot,
        contactNumber,
        message: bookingMessage
      });

      if (res.data.success) {
        setBookingSuccess(true);
        showToast('Reservation / Visit request sent to host!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit booking', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to leave a review.', 'info');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please write a review comment.', 'error');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        propertyId: property._id,
        rating,
        comment: reviewComment
      });

      if (res.data.success) {
        showToast('Review posted successfully!', 'success');
        setReviewComment('');
        fetchPropertyData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post review', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b', fontWeight: '600' }}>
        Loading property details...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Property Not Found</h2>
        <p style={{ color: '#64748b', margin: '12px 0 24px' }}>The listing you are looking for does not exist or has been removed.</p>
        <Link to="/properties" className="btn btn-primary">Back to Listings</Link>
      </div>
    );
  }

  const images = (property.images && property.images.length > 0)
    ? property.images
    : ['/datasets-images/image_0.jpg'];

  return (
    <div className="container" style={{ padding: '32px 1.5rem 80px' }}>
      {/* Back button */}
      <Link to="/properties" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Search Results
      </Link>

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-primary">{property.propertyType}</span>
            <span className="badge badge-success">{property.roomType || 'Entire home/apt'}</span>
            <span className="badge badge-warning">Asheville, NC</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {property.title}
          </h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.95rem' }}>
            <MapPin size={16} color="#3b82f6" /> {property.location?.address}, {property.location?.city || 'Asheville'}, NC
          </p>
        </div>

        {/* Price Box */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Nightly Price</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a' }}>
            ${Number(property.price).toLocaleString('en-US')}
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '500' }}> /night</span>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{
          height: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: '#e2e8f0',
          marginBottom: '12px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <img
            src={images[selectedImageIndex]}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000';
            }}
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                style={{
                  width: '90px',
                  height: '65px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedImageIndex === idx ? '3px solid #3b82f6' : '1px solid var(--border-color)',
                  opacity: selectedImageIndex === idx ? 1 : 0.65,
                  transition: 'var(--transition)',
                  flexShrink: 0
                }}
              >
                <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '36px' }}>
        {/* Left Column */}
        <div>
          {/* Key Specs Card */}
          <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
              Property Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={16} /> Capacity
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {property.accommodates || 4} Guests
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BedDouble size={16} /> Bedrooms
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {property.bedrooms || property.bhk || 2} Bedrooms
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Bath size={16} /> Bathrooms
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {property.bathrooms || property.bathroom || 1.5} Baths
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Min Stay</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {property.minNights || 2} Nights
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Room Type</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {property.roomType || 'Entire home/apt'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Conformal Bounds Card */}
          {property.predictedRentInfo?.predictedRent && (
            <div className="ai-prediction-card" style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} color="#7c3aed" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Nightly Rental Price Valuation & Uncertainty Range
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, marginBottom: '14px' }}>
                Our research-trained HistGradientBoosting model (with log1p target transformation) and calibrated 95% conformal prediction intervals estimated fair market nightly rates for this property:
              </p>
              <div style={{
                background: '#ffffff',
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1px solid #c4b5fd'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    PREDICTED NIGHTLY RENTAL PRICE
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>
                    ₹{usdToInr(property.predictedRentInfo.predictedRent).toLocaleString('en-IN')}/night
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    USD: ${Number(property.predictedRentInfo.predictedRent).toFixed(2)}/night (1 USD = ₹{USD_TO_INR_RATE})
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>Calibrated 95% Prediction Interval</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                    ₹{usdToInr(property.predictedRentInfo.lowerBound).toLocaleString('en-IN')} – ₹{usdToInr(property.predictedRentInfo.upperBound).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                    <ShieldCheck size={13} /> EMPIRICAL COVERAGE: 93.70%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
              About This Property
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
                Included Amenities & Features
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {property.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#f1f5f9',
                      color: '#1e293b',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <CheckCircle size={14} color="#10b981" /> {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* OpenStreetMap Location */}
          <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
              Location & Neighborhood
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>
              {property.location?.address}, {property.location?.city || 'Asheville'}, NC
            </p>
            <MapViewer singleProperty={property} height="320px" zoom={14} />
          </div>

          {/* Reviews & Ratings Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>Guest Reviews</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified feedback from guests</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '6px 12px', borderRadius: '10px' }}>
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#92400e' }}>
                  {avgRating > 0 ? avgRating : (property.reviewScoresRating || '4.9')}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#b45309' }}>({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Existing Reviews List */}
            {reviews.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {reviews.map((rev) => (
                  <div key={rev._id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>
                        {rev.user?.name || 'Verified Guest'}
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? '#f59e0b' : 'none'} color={i < rev.rating ? '#f59e0b' : '#cbd5e1'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                      {rev.comment}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leave a review form */}
            {isAuthenticated && (
              <form onSubmit={handleReviewSubmit} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px' }}>Write a Review</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star size={20} fill={num <= rating ? '#f59e0b' : 'none'} color={num <= rating ? '#f59e0b' : '#cbd5e1'} />
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Share details about the property condition, neighborhood, and host..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="form-textarea"
                    rows="3"
                  />
                </div>
                <button type="submit" disabled={reviewSubmitting} className="btn btn-primary btn-sm">
                  <MessageSquare size={15} /> {reviewSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Booking Card & Owner Info */}
        <div>
          <div style={{ position: 'sticky', top: '90px' }}>
            {/* Booking Form Card */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Schedule a Visit / Stay
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '18px' }}>
                Select your preferred date to tour or book this property in Asheville.
              </p>

              {bookingSuccess ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ color: '#065f46', fontWeight: '800' }}>Request Submitted!</h4>
                  <p style={{ fontSize: '0.825rem', color: '#047857', marginTop: '4px' }}>
                    The property host has been notified. You can monitor the approval status in your Guest Dashboard.
                  </p>
                  <Link to="/tenant/dashboard" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                    View My Bookings
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit}>
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time Slot</label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="form-select"
                    >
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (828) 555-0199"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Message / Query (Optional)</label>
                    <textarea
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      className="form-textarea"
                      rows="2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', fontWeight: '700' }}
                  >
                    <Calendar size={18} />
                    {bookingSubmitting ? 'Sending Request...' : 'Request Visit / Stay'}
                  </button>
                </form>
              )}
            </div>

            {/* Owner Info Card */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Property Host
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  {property.owner?.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                    {property.owner?.name || 'Verified Host'}
                  </h4>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    Superhost
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#3b82f6" /> {property.owner?.phone || '+1 (828) 555-0100'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#3b82f6" /> {property.owner?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
