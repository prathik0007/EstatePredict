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
  AlertCircle,
  Info
} from 'lucide-react';
import mlApi from '../services/mlApi';
import { usdToInr, getInrPrice, USD_TO_INR_RATE } from '../utils/currency';

const EstimatorPage = () => {
  const [formData, setFormData] = useState({
    city: 'Mumbai',
    accommodates: 4,
    bedrooms: 2,
    bathrooms: 2,
    min_nights: 2,
    room_type: 'Entire home/apt',
    property_type: 'Entire rental unit',
    review_scores_rating: 4.90,
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

      const res = await mlApi.post('/predict-rent', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success && res.data.data) {
        setPrediction(res.data.data);
      } else {
        setError('Invalid prediction response received from ML server.');
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.error || err.response.data?.message || err.message;
        if (status >= 400 && status < 500) {
          setError(`ML Service Client Error (HTTP ${status}): ${msg || 'Invalid request parameters'}`);
        } else {
          setError(`ML Service Server Error (HTTP ${status}): ${msg || 'Internal prediction service error'}`);
        }
      } else if (err.request) {
        setError('Connection failure: Unable to reach the Python Flask ML service on Render. Please verify the service is awake and active.');
      } else {
        setError(`Error communicating with ML server: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 1.5rem 80px', maxWidth: '1140px' }}>
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
          <Sparkles size={16} /> Multimodal V3 Research Benchmark
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          AI Nightly Rental Price Valuation & Prediction Intervals
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '750px', margin: '8px auto 0' }}>
          Predict calibrated nightly market rates using HistGradientBoosting with log1p target transformation, calibrated 95% conformal prediction intervals, and SHAP factor attribution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 1fr)', gap: '32px' }}>
        {/* Form Inputs */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleEstimate}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '18px' }}>
              Property Features & Specifications (Asheville, NC)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Neighborhood / Area</label>
                <select name="city" value={formData.city} onChange={handleInputChange} className="form-select">
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Pune">Pune</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Lucknow">Lucknow</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Accommodates (Guests)</label>
                <input type="number" name="accommodates" min="1" max="16" value={formData.accommodates} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input type="number" name="bedrooms" min="0" max="10" value={formData.bedrooms} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <input type="number" step="0.5" name="bathrooms" min="1" max="10" value={formData.bathrooms} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Nights</label>
                <input type="number" name="min_nights" min="1" max="30" value={formData.min_nights} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Review Score Rating</label>
                <input type="number" step="0.01" name="review_scores_rating" min="1" max="5" value={formData.review_scores_rating} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select name="room_type" value={formData.room_type} onChange={handleInputChange} className="form-select">
                  <option value="Entire home/apt">Entire home/apt</option>
                  <option value="Private room">Private room</option>
                  <option value="Shared room">Shared room</option>
                  <option value="Hotel room">Hotel room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="form-select">
                  <option value="Entire rental unit">Entire rental unit</option>
                  <option value="Entire home">Entire home</option>
                  <option value="Entire guest suite">Entire guest suite</option>
                  <option value="Entire townhouse">Entire townhouse</option>
                  <option value="Private room in home">Private room in home</option>
                </select>
              </div>
            </div>

            {/* Image Upload for Multimodal Visual Representation */}
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} color="#3b82f6" /> Primary Property Image (EfficientNet-B0 1,280-d Visual Representation)
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
              <label className="form-label">Property Description (all-MiniLM-L6-v2 384-d Text Representation)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder="Spacious mountain retreat near Downtown Asheville with panoramic Blue Ridge views, luxury amenities, fast WiFi, and private deck..."
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
                  <RefreshCw size={18} className="pulse-badge" /> Running HistGradientBoosting Pipeline...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Predict Nightly Rental Price
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

              {/* Main Predicted Nightly Price */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #c4b5fd', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    PREDICTED NIGHTLY RENTAL PRICE
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                    USD: ${Number(prediction.predicted_rent || prediction.predicted_price_usd).toFixed(2)}/night
                  </span>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                  ₹{getInrPrice(prediction, 'predicted_rent').toLocaleString('en-IN')}
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#64748b' }}>/night</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span>Model: HistGradientBoostingRegressor (log1p target transform)</span>
                  <span>Conversion rate: 1 USD = ₹{USD_TO_INR_RATE}</span>
                </div>
              </div>

              {/* Conformal Prediction Interval */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={16} /> Calibrated 95% Prediction Interval
                  </span>
                  <span className="badge badge-success" style={{ fontWeight: '800', letterSpacing: '0.03em' }}>
                    EMPIRICAL COVERAGE: 93.70%
                  </span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                  ₹{getInrPrice(prediction, 'lower_bound').toLocaleString('en-IN')} – ₹{getInrPrice(prediction, 'upper_bound').toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                  Calibrated conformal interval derived on separate calibration partition (cutoff q̂ = 0.8606 on log scale; USD range: ${Number(prediction.lower_bound).toFixed(2)} – ${Number(prediction.upper_bound).toFixed(2)}). Display converted to INR at 1 USD = ₹{USD_TO_INR_RATE}.
                </p>
              </div>

              {/* SHAP Factor Attribution */}
              {prediction.top_factors && prediction.top_factors.length > 0 && (
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={16} color="#7c3aed" /> SHAP Feature Attribution
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                    SHAP values provide post-hoc model interpretation indicating relative feature impact on the log-price prediction.
                  </p>
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
                          {item.impact >= 0 ? `+${item.impact}` : `${item.impact}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* V3 Research Benchmark Metrics */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={14} color="#3b82f6" /> Finalized Multimodal V3 Benchmark Metrics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                  <div>MAE: <strong>$74.07</strong></div>
                  <div>RMSE: <strong>$158.64</strong></div>
                  <div>R²: <strong>0.5318</strong></div>
                  <div>MAPE: <strong>33.66%</strong></div>
                  <div>MedAE: <strong>$34.88</strong></div>
                  <div>Nominal Coverage: <strong>95.00%</strong></div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Dataset: Asheville, NC Inside Airbnb (Dec 18, 2023, N = 1,800). Tabular-only HistGradientBoosting achieved top performance in ablation experiments.
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Cpu size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>Ready for ML Valuation</h3>
              <p style={{ fontSize: '0.875rem', marginTop: '6px' }}>
                Fill out the property specifications on the left and click predict to evaluate through the Multimodal V3 pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimatorPage;
