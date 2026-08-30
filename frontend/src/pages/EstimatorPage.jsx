import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Cpu,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

const EstimatorPage = () => {
  const [formData, setFormData] = useState({
    city: 'Mumbai',
    bhk: 2,
    size: 1100,
    bathroom: 2,
    areaType: 'Super Area',
    furnishingStatus: 'Semi-Furnished',
    tenantPreferred: 'Bachelors',
    propertyType: 'Apartment',
    roomType: 'Entire home/apt',
    description: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await api.post('/ml/predict-rent', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setPrediction(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with ML server. Please check that Python Flask ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 1.5rem 80px', maxWidth: '1080px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
          color: '#6d28d9',
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '0.825rem',
          fontWeight: '700',
          marginBottom: '12px'
        }}>
          <Sparkles size={16} /> Explainable Multimodal ML Engine
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          AI Rental Price Valuation & Confidence Intervals
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '700px', margin: '8px auto 0' }}>
          Calculate scientifically calibrated market rent using Random Forest Regressors, MAPIE conformal prediction bounds, and SHAP explainability.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(340px, 1fr)', gap: '32px' }}>
        {/* Form Inputs */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleEstimate}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '18px' }}>
              Property Features & Visuals
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
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
                <label className="form-label">BHK</label>
                <input type="number" name="bhk" min="1" max="10" value={formData.bhk} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Size (sq.ft)</label>
                <input type="number" name="size" min="100" max="20000" value={formData.size} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <input type="number" name="bathroom" min="1" max="10" value={formData.bathroom} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Area Classification</label>
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
            </div>

            {/* Image Upload for EfficientNetB0 */}
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} color="#3b82f6" /> Property Photo (for EfficientNetB0 Image Embedding)
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={imagePreview} alt="Preview" style={{ height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Description for SentenceTransformer */}
            <div className="form-group">
              <label className="form-label">Description (for all-MiniLM-L6-v2 Text Embedding)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder="Enter property details, amenities, locality, furnishing features..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent btn-lg"
              style={{ width: '100%', fontWeight: '800' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="pulse-badge" /> Extracting 1,675 Features & Estimating...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Predict Market Rental Price
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results & SHAP Explanation */}
        <div>
          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {prediction ? (
            <div className="ai-prediction-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#8b5cf6', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Sparkles size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                  AI Valuation Results
                </h3>
              </div>

              {/* Main Predicted Rent */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #c4b5fd', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase' }}>
                  Estimated Monthly Rent
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                  ₹{Number(prediction.predicted_rent).toLocaleString('en-IN')}
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#64748b' }}> /month</span>
                </div>
              </div>

              {/* Conformal Confidence Interval */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={16} /> 95% Confidence Interval (MAPIE)
                  </span>
                  <span className="badge badge-success">Coverage Guaranteed</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e293b' }}>
                  ₹{Number(prediction.lower_bound).toLocaleString('en-IN')} – ₹{Number(prediction.upper_bound).toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Statistically calibrated interval accounting for location variance and property specifications.
                </p>
              </div>

              {/* SHAP Factor Importance */}
              {prediction.top_factors && prediction.top_factors.length > 0 && (
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={16} color="#7c3aed" /> Top Influencing Feature Factors (SHAP)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {prediction.top_factors.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                        <span style={{ color: '#475569', fontWeight: '600' }}>{item.feature}</span>
                        <span style={{
                          fontWeight: '800',
                          color: item.impact >= 0 ? '#15803d' : '#b91c1c',
                          background: item.impact >= 0 ? '#dcfce7' : '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {item.impact >= 0 ? `+₹${item.impact}` : `-₹${Math.abs(item.impact)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Cpu size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>Ready for ML Valuation</h3>
              <p style={{ fontSize: '0.875rem', marginTop: '6px' }}>
                Fill out the property specifications on the left and click predict to extract 1,675 multimodal features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimatorPage;
