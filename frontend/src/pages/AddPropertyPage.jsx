import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { INDIAN_CITIES, INDIAN_CITY_NAMES, getCityData } from '../utils/indianCities';
import { getPropertyImageUrl } from '../utils/imageUtils';
import api from '../services/api';

const AMENITIES_LIST = [
  'Air Conditioning',
  'Wifi Included',
  'Free Parking on Premises',
  'Full Kitchen',
  'Mountain Views',
  'Patio or Balcony',
  'Washer & Dryer',
  'Dedicated Workspace',
  'Heating',
  'Self Check-in',
  'Hot Tub',
  'Fire Pit',
  'Pet Friendly',
  'Coffee Maker',
  'BBQ Grill'
];

const AddPropertyPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    listingType: 'Rent',
    propertyType: 'Entire rental unit',
    roomType: 'Entire home/apt',
    accommodates: 4,
    bedrooms: 2,
    bathrooms: 2,
    minNights: 2,
    reviewScoresRating: 4.90,
    address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
    coordinates: { lat: 12.9716, lng: 77.5946 }
  });

  const [selectedAmenities, setSelectedAmenities] = useState(['Wifi Included', 'Air Conditioning', 'Free Parking on Premises']);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(isEdit);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiValuationInfo, setAiValuationInfo] = useState(null);

  // If editing an existing property, fetch its current details
  useEffect(() => {
    if (!isEdit) return;

    const fetchPropertyForEdit = async () => {
      setFetchingProperty(true);
      try {
        const res = await api.get(`/properties/${id}`);
        if (res.data.success && res.data.property) {
          const prop = res.data.property;
          const loc = prop.location || {};
          const cityMatch = getCityData(loc.city);

          setFormData({
            title: prop.title || '',
            description: prop.description || '',
            price: prop.price || '',
            listingType: prop.listingType || 'Rent',
            propertyType: prop.propertyType || 'Entire rental unit',
            roomType: prop.roomType || 'Entire home/apt',
            accommodates: prop.accommodates || 4,
            bedrooms: prop.bedrooms || prop.bhk || 2,
            bathrooms: prop.bathrooms || 2,
            minNights: prop.minNights || 2,
            reviewScoresRating: prop.reviewScoresRating || 4.90,
            address: loc.address || '',
            city: loc.city || 'Bangalore',
            state: loc.state || (cityMatch ? cityMatch.state : 'Karnataka'),
            pincode: loc.pincode || (cityMatch ? cityMatch.pincode : ''),
            country: loc.country || 'India',
            coordinates: loc.coordinates?.lat && loc.coordinates?.lng
              ? { lat: loc.coordinates.lat, lng: loc.coordinates.lng }
              : (cityMatch ? { lat: cityMatch.lat, lng: cityMatch.lng } : { lat: 12.9716, lng: 77.5946 })
          });

          if (Array.isArray(prop.amenities) && prop.amenities.length > 0) {
            setSelectedAmenities(prop.amenities);
          }
          if (Array.isArray(prop.images) && prop.images.length > 0) {
            setExistingImages(prop.images);
          }
          if (prop.predictedRentInfo) {
            setAiValuationInfo(prop.predictedRentInfo);
          }
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Error fetching property for editing', 'error');
        navigate('/owner/dashboard');
      } finally {
        setFetchingProperty(false);
      }
    };

    fetchPropertyForEdit();
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (e) => {
    const chosenCity = e.target.value;
    const cityData = getCityData(chosenCity);
    if (cityData) {
      setFormData(prev => ({
        ...prev,
        city: cityData.city,
        state: cityData.state,
        pincode: prev.pincode && prev.pincode !== '560001' ? prev.pincode : cityData.pincode,
        coordinates: { lat: cityData.lat, lng: cityData.lng }
      }));
    } else {
      setFormData(prev => ({ ...prev, city: chosenCity }));
    }
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
    showToast(`AI Suggested Price of $${Math.round(suggestedPrice).toLocaleString('en-US')} applied!`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      showToast('Please fill all required property fields (Title, Price, City, Address)', 'error');
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
      data.append('accommodates', formData.accommodates);
      data.append('bedrooms', formData.bedrooms);
      data.append('bathrooms', formData.bathrooms);
      data.append('minNights', formData.minNights);
      data.append('reviewScoresRating', formData.reviewScoresRating);

      // Location object with full Indian metadata
      const locationObj = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country || 'India',
        coordinates: formData.coordinates
      };
      data.append('location', JSON.stringify(locationObj));
      data.append('amenities', JSON.stringify(selectedAmenities));

      if (aiValuationInfo) {
        data.append('predictedRentInfo', JSON.stringify(aiValuationInfo));
      }

      // Append new image files if selected
      selectedImages.forEach(file => {
        data.append('images', file);
      });

      let res;
      if (isEdit) {
        res = await api.put(`/properties/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/properties', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        showToast(isEdit ? 'Property updated successfully!' : 'Property listed successfully!', 'success');
        navigate('/owner/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || (isEdit ? 'Failed to update property' : 'Failed to list property'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProperty) {
    return (
      <div className="container" style={{ padding: '80px 1.5rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="pulse-badge" style={{ marginBottom: '12px' }} />
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 1.5rem 80px', maxWidth: '860px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <Building2 size={28} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
          {isEdit ? 'Edit Rental Property' : 'List a New Rental Property'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto' }}>
          {isEdit
            ? 'Update property details, location coordinates, amenities, or nightly pricing.'
            : 'Add your property in one of our 8 supported Indian metropolitan cities with OpenStreetMap pin placement.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            1. Property Details
          </h3>

          <div className="form-group">
            <label className="form-label">Property Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Spacious 2 BHK Luxury Apartment with Balcony"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Property Type *</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="form-select">
                <option value="Entire rental unit">Entire rental unit (Apartment)</option>
                <option value="Entire home">Entire home (Independent House)</option>
                <option value="Entire guest suite">Entire guest suite</option>
                <option value="Entire guesthouse">Entire guesthouse</option>
                <option value="Villa">Luxury Villa</option>
                <option value="Condominium">Condominium</option>
                <option value="Private room in home">Private room in home</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Type *</label>
              <select name="roomType" value={formData.roomType} onChange={handleInputChange} className="form-select">
                <option value="Entire home/apt">Entire home/apt</option>
                <option value="Private room">Private room</option>
                <option value="Shared room">Shared room</option>
                <option value="Hotel room">Hotel room</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Listing Type</label>
              <select name="listingType" value={formData.listingType} onChange={handleInputChange} className="form-select">
                <option value="Rent">Rent</option>
                <option value="Short-Stay">Short-Stay</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe your property, furnishings, proximity to tech parks, metro stations, markets..."
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 2: Capacity, Specs & Pricing */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                2. Specs & Nightly Rental Rate
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
                Specify capacity, room counts, and nightly price
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="btn btn-primary btn-sm"
              title="Open Research AI Price Estimator"
            >
              <Sparkles size={16} /> Austin AI Valuation Tool
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Max Guests *</label>
              <input type="number" name="accommodates" min="1" max="20" value={formData.accommodates} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Bedrooms *</label>
              <input type="number" name="bedrooms" min="0" max="10" value={formData.bedrooms} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Bathrooms *</label>
              <input type="number" step="0.5" name="bathrooms" min="1" max="10" value={formData.bathrooms} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Min Nights</label>
              <input type="number" name="minNights" min="1" max="30" value={formData.minNights} onChange={handleInputChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Rating</label>
              <input type="number" step="0.01" name="reviewScoresRating" min="1" max="5" value={formData.reviewScoresRating} onChange={handleInputChange} className="form-input" />
            </div>
          </div>

          {/* Pricing input with AI badge indicator */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Rental Price ($/night) *</span>
              {aiValuationInfo && (
                <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
                  <Sparkles size={12} /> AI Valuated (${aiValuationInfo.predictedRent})
                </span>
              )}
            </label>
            <input
              type="number"
              name="price"
              placeholder="e.g. 150"
              value={formData.price}
              onChange={handleInputChange}
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}
              required
            />
          </div>
        </div>

        {/* Section 3: Indian City Location & Leaflet OpenStreetMap Pin Picker */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
            3. Property Location (8 Supported Indian Cities)
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '16px' }}>
            Select your Indian city, verify the state and PIN code, and pinpoint the exact coordinates on OpenStreetMap.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City *</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                className="form-select"
                required
              >
                {INDIAN_CITIES.map(c => (
                  <option key={c.city} value={c.city}>{c.city} ({c.state})</option>
                ))}
                {/* Maintain existing USA cities if editing legacy listing */}
                {formData.city && !INDIAN_CITY_NAMES.includes(formData.city) && (
                  <option value={formData.city}>{formData.city}</option>
                )}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">State *</label>
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">PIN Code *</label>
              <input
                type="text"
                name="pincode"
                placeholder="e.g. 560001"
                value={formData.pincode}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || 'India'}
                onChange={handleInputChange}
                className="form-input"
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. #24, 1st Cross, MG Road, Indiranagar"
              value={formData.address}
              onChange={handleInputChange}
              className="form-input"
              required
            />
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
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Property Photos (Cloudinary Upload) */}
        <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
            5. Property Images {isEdit ? '(Add More or Replace)' : ''}
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '16px' }}>
            Upload high quality photos of the property. Images are permanently hosted on Cloudinary CDN.
          </p>

          {/* Show existing images if editing */}
          {isEdit && existingImages.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                Current Uploaded Photos:
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={getPropertyImageUrl(img)}
                    alt=""
                    style={{ width: '90px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '30px 20px',
            textAlign: 'center',
            background: '#f8fafc',
            cursor: 'pointer'
          }}>
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '50%', color: '#4f46e5' }}>
                <Upload size={24} />
              </div>
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                Click to browse property photos
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                PNG, JPG, JPEG, WEBP up to 10MB each
              </span>
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '16px' }}>
              {imagePreviews.map((src, i) => (
                <div key={i} style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/owner/dashboard')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '180px', fontWeight: '700' }}
          >
            {loading ? (isEdit ? 'Updating Property...' : 'Publishing Listing...') : (isEdit ? 'Save Changes' : 'Publish Property Listing')}
          </button>
        </div>
      </form>

      {/* AI Price Estimator Modal (Austin Research Benchmark Tool) */}
      <AiPriceEstimatorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        initialData={{
          city: 'Downtown Austin',
          latitude: 30.2747,
          longitude: -97.7404,
          accommodates: formData.accommodates,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          minNights: formData.minNights,
          roomType: formData.roomType,
          propertyType: formData.propertyType,
          reviewScoresRating: formData.reviewScoresRating,
          description: formData.description
        }}
        imageFile={selectedImages.length > 0 ? selectedImages[0] : null}
        onApplyPrice={handleApplyAiPrice}
      />
    </div>
  );
};

export default AddPropertyPage;
