import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import AiPriceEstimatorModal from '../components/AiPriceEstimatorModal';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

const AMENITIES_LIST = [
  'Air Conditioning',
  'Swimming Pool',
  'Gymnasium',
  'Club House',
  'Covered Parking',
  '24/7 Security',
  'Power Backup',
  'High Speed Elevators',
  'Children Play Area',
  'Gated Community',
  'Balcony',
  'Wifi Included',
  'Modular Kitchen',
  'Water Purifier',
  'Private Garden'
];

const AddPropertyPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    listingType: 'Rent',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    bhk: 2,
    size: 1000,
    bathroom: 2,
    bedrooms: 2,
    bathroomsAirbnb: 2.0,
    areaType: 'Super Area',
    furnishingStatus: 'Semi-Furnished',
    tenantPreferred: 'Anyone',
    address: '',
    city: 'Mumbai',
    state: '',
    pincode: '',
    coordinates: { lat: 19.0760, lng: 72.8777 }
  });

  const [selectedAmenities, setSelectedAmenities] = useState(['24/7 Security', 'Power Backup', 'Covered Parking']);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiValuationInfo, setAiValuationInfo] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleApplyAiPrice = (suggestedPrice, aiData) => {
    setFormData(prev => ({ ...prev, price: Math.round(suggestedPrice) }));
    setAiValuationInfo({
      predictedRent: aiData.predicted_rent,
      lowerBound: aiData.lower_bound,
      upperBound: aiData.upper_bound,
      confidenceLevel: aiData.confidence_level || '95%',
      estimatedAt: new Date()
    });
    showToast(`AI Suggested Price of ₹${Math.round(suggestedPrice).toLocaleString('en-IN')} applied!`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.address) {
      showToast('Please fill all required property fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('listingType', formData.listingType);
      data.append('propertyType', formData.propertyType);
      data.append('roomType', formData.roomType);
      data.append('bhk', formData.bhk);
      data.append('size', formData.size);
      data.append('bathroom', formData.bathroom);
      data.append('bedrooms', formData.bedrooms || formData.bhk);
      data.append('bathroomsAirbnb', formData.bathroomsAirbnb || formData.bathroom);
      data.append('areaType', formData.areaType);
      data.append('furnishingStatus', formData.furnishingStatus);
      data.append('tenantPreferred', formData.tenantPreferred);

      // Location object
      const locationObj = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        coordinates: formData.coordinates
      };
      data.append('location', JSON.stringify(locationObj));
      data.append('amenities', JSON.stringify(selectedAmenities));

      if (aiValuationInfo) {
        data.append('predictedRentInfo', JSON.stringify(aiValuationInfo));
      }

      // Append image files
      selectedImages.forEach(file => {
        data.append('images', file);
      });

      const res = await api.post('/properties', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Property listed successfully!', 'success');
        navigate('/owner/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to list property', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 1.5rem 80px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
          Create New Property Listing
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Fill in details about your property and use our built-in Multimodal AI to calculate fair market rent.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Info */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            1. Basic Listing Information
          </h3>

          <div className="form-group">
            <label className="form-label">Property Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Spacious 3 BHK Sea-View Flat in Bandra West"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="form-select">
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Condominium">Condominium</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select name="roomType" value={formData.roomType} onChange={handleInputChange} className="form-select">
                <option value="Entire home/apt">Entire home/apt</option>
                <option value="Private room">Private room</option>
                <option value="Shared room">Shared room</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Listing Type</label>
              <select name="listingType" value={formData.listingType} onChange={handleInputChange} className="form-select">
                <option value="Rent">Rent</option>
                <option value="Sale">Sale</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Specifications & AI Rent Estimator Banner */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
              2. Dimensions & Specifications
            </h3>

            {/* Trigger AI Valuation Modal */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="btn btn-accent btn-sm"
              style={{ fontWeight: '700' }}
            >
              <Sparkles size={16} /> Estimate Rent with AI
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">BHK *</label>
              <input type="number" name="bhk" min="1" max="10" value={formData.bhk} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Super / Carpet Size (sq.ft) *</label>
              <input type="number" name="size" min="100" max="50000" value={formData.size} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Bathrooms *</label>
              <input type="number" name="bathroom" min="1" max="10" value={formData.bathroom} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Area Type</label>
              <select name="areaType" value={formData.areaType} onChange={handleInputChange} className="form-select">
                <option value="Super Area">Super Area</option>
                <option value="Carpet Area">Carpet Area</option>
                <option value="Built Area">Built Area</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Furnishing Status</label>
              <select name="furnishingStatus" value={formData.furnishingStatus} onChange={handleInputChange} className="form-select">
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tenant Preferred</label>
              <select name="tenantPreferred" value={formData.tenantPreferred} onChange={handleInputChange} className="form-select">
                <option value="Anyone">Anyone</option>
                <option value="Family">Family</option>
                <option value="Bachelors">Bachelors</option>
              </select>
            </div>
          </div>

          {/* Pricing input with AI badge indicator */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Monthly Rental Price (₹) *</span>
              {aiValuationInfo && (
                <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
                  <Sparkles size={12} /> AI Valuated
                </span>
              )}
            </label>
            <input
              type="number"
              name="price"
              placeholder="e.g. 35000"
              value={formData.price}
              onChange={handleInputChange}
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}
              required
            />
          </div>
        </div>

        {/* Section 3: Location & Leaflet OpenStreetMap Pin Picker */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            3. Property Location & Map Pin
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <select name="city" value={formData.city} onChange={handleInputChange} className="form-select">
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Locality / Address *</label>
              <input
                type="text"
                name="address"
                placeholder="e.g. 12th Main Road, Indiranagar"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <LocationPicker
            city={formData.city}
            value={formData.coordinates}
            onChange={(coords) => setFormData(prev => ({ ...prev, coordinates: coords }))}
          />
        </div>

        {/* Section 4: Amenities */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            4. Available Amenities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {AMENITIES_LIST.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <div
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    transition: 'var(--transition)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ pointerEvents: 'none' }}
                  />
                  <span>{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Image Uploads & Description */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            5. Photos & Description
          </h3>

          <div className="form-group">
            <label className="form-label">Upload Property Photos (Up to 8 images)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="form-input"
            />
          </div>

          {/* Previews */}
          {imagePreviews.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '18px', padding: '6px 0' }}>
              {imagePreviews.map((preview, i) => (
                <img
                  key={i}
                  src={preview}
                  alt=""
                  style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Property Description</label>
            <textarea
              name="description"
              placeholder="Describe the condition, natural lighting, nearby landmarks, metro connectivity..."
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
            />
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', fontWeight: '800' }}
        >
          {loading ? 'Publishing Listing...' : 'Publish Property Listing'}
        </button>
      </form>

      {/* AI Estimator Modal */}
      <AiPriceEstimatorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        initialData={formData}
        imageFile={selectedImages.length > 0 ? selectedImages[0] : null}
        onApplyPrice={handleApplyAiPrice}
      />
    </div>
  );
};

export default AddPropertyPage;
