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
  Info,
  MapPin
} from 'lucide-react';
import mlApi from '../services/mlApi';
import { usdToInr, getInrPrice, USD_TO_INR_RATE } from '../utils/currency';

const AUSTIN_NEIGHBORHOODS = [
  { name: 'Downtown Austin', lat: 30.2747, lng: -97.7404 },
  { name: 'South Congress (SoCo)', lat: 30.2505, lng: -97.7497 },
  { name: 'East Austin', lat: 30.2625, lng: -97.7215 },
  { name: 'Zilker / Barton Hills', lat: 30.2670, lng: -97.7730 },
  { name: 'The Domain / North Austin', lat: 30.4014, lng: -97.7247 },
  { name: 'UT Austin / West Campus', lat: 30.2849, lng: -97.7341 },
  { name: 'South Lamar / Bouldin Creek', lat: 30.2510, lng: -97.7610 },
  { name: 'Mueller / Central East', lat: 30.3015, lng: -97.7050 },
  { name: 'Hyde Park', lat: 30.3050, lng: -97.7300 },
  { name: 'Rainey Street / Convention Center', lat: 30.2635, lng: -97.7397 },
  { name: 'Austin Airport Corridor', lat: 30.1975, lng: -97.6664 }
];

const EstimatorPage = () => {
  const [formData, setFormData] = useState({
    city: 'Downtown Austin',
    latitude: 30.2747,
    longitude: -97.7404,
    accommodates: 4,
    bedrooms: 2,
    bathrooms: 2,
    min_nights: 2,
    room_type: 'Entire home/apt',
    property_type: 'Entire rental unit',
    review_scores_rating: 4.85,
    description: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      const selected = AUSTIN_NEIGHBORHOODS.find(n => n.name === value);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          city: value,
          latitude: selected.lat,
          longitude: selected.lng
        }));
        return;
      }
    }
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
      if (formData.review_scores_rating !== undefined) {
        data.append('rating', formData.review_scores_rating);
        data.append('review_scores_rating', formData.review_scores_rating);
      }
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
        setError('Connection failure: Unable to reach the Python Flask ML service. Please verify the service is running.');
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
          <Sparkles size={16} /> V5 Multimodal Research Benchmark
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          AI Rental Price Valuation & Prediction Intervals
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '780px', margin: '8px auto 0' }}>
          Predict calibrated market rates using LightGBM multimodal concatenation, 20 target-independent geographic distance features (Austin, TX), 95% nominal conformal prediction intervals, and SHAP attribution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 1fr)', gap: '32px' }}>
        {/* Form Inputs */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleEstimate}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                Property Features & Specifications (Austin, TX)
              </h3>
              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                5,050 Cohort Aligned
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Austin Neighborhood / District</label>
                <select name="city" value={formData.city} onChange={handleInputChange} className="form-select">
                  {AUSTIN_NEIGHBORHOODS.map(n => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
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
                <label className="form-label">Review Score Rating (1.00 - 5.00)</label>
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
                  <option value="Entire condo">Entire condo</option>
                  <option value="Private room in home">Private room in home</option>
                </select>
              </div>
            </div>

            {/* Primary Property Image Input */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} color="#3b82f6" /> Primary Property Image (CLIP ViT-B/32 512-d Visual Representation)
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                V5 processes 1 verified primary listing image. If omitted, the 91-feature Tabular+Geographic LightGBM pipeline serves inference.
              </div>
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={imagePreview} alt="Preview" style={{ height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Property Description Input */}
            <div className="form-group">
              <label className="form-label">Property Description (BGE-small 384-d Text Representation)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder="Stylish modern Austin home near Downtown and Lady Bird Lake, featuring high ceilings, open kitchen, private patio, fast fiber internet, and dedicated workspace..."
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Normalized BAAI/bge-small-en-v1.5 embedding. If omitted, the 91-feature Tabular+Geographic fallback is used.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent btn-lg"
              style={{ width: '100%', fontWeight: '800' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="pulse-badge" /> Running V5 LightGBM Pipeline...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Predict Rental Price
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#8b5cf6', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Sparkles size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                    AI Valuation Results
                  </h3>
                </div>
                {prediction.pipeline_used && (
                  <span style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#6d28d9', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    {prediction.image_used && prediction.description_used ? '987d Multimodal' : '91d Tabular+Geo Fallback'}
                  </span>
                )}
              </div>

              {/* Main Predicted Rental Price */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #c4b5fd', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    PREDICTED RENTAL PRICE
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                    USD: ${Number(prediction.predicted_rent || prediction.predicted_price_usd).toFixed(2)} / night
                  </span>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                  ₹{getInrPrice(prediction, 'predicted_rent').toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span>Model: {prediction.model_name || 'LightGBM Multimodal Concatenation'}</span>
                  <span>Conversion rate: 1 USD = ₹{USD_TO_INR_RATE}</span>
                </div>
              </div>

              {/* Conformal Prediction Interval */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={16} /> 95% Nominal Conformal Interval
                  </span>
                  <span className="badge badge-success" style={{ fontWeight: '800', letterSpacing: '0.03em' }}>
                    EMPIRICAL COVERAGE: 96.63%
                  </span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                  ₹{getInrPrice(prediction, 'lower_bound').toLocaleString('en-IN')} – ₹{getInrPrice(prediction, 'upper_bound').toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                  Distribution-free conformal interval (finite-sample quantile q = 0.8435 on log scale; USD range: ${Number(prediction.lower_bound).toFixed(2)} – ${Number(prediction.upper_bound).toFixed(2)}). Display converted to INR at 1 USD = ₹{USD_TO_INR_RATE}.
                </p>
              </div>

              {/* SHAP Factor Attribution */}
              {prediction.top_factors && prediction.top_factors.length > 0 && (
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={16} color="#7c3aed" /> SHAP Feature Attribution
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                    TreeSHAP relative attribution indicating feature contribution to log-scale price prediction across physical & Austin landmark features.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {prediction.top_factors.map((item, idx) => {
                      const impactNum = typeof item.impact === 'number' ? item.impact : parseFloat(item.impact);
                      const isNearZero = isNaN(impactNum) || Math.abs(impactNum) < 0.005;
                      const formattedVal = isNearZero ? '0' : (impactNum > 0 ? `+${impactNum}` : `${impactNum}`);
                      const isPositive = impactNum >= 0;

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                          <span style={{ color: '#475569', fontWeight: '600' }}>{item.feature}</span>
                          <span style={{
                            fontWeight: '800',
                            color: isPositive ? '#15803d' : '#b91c1c',
                            background: isPositive ? '#dcfce7' : '#fee2e2',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {formattedVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* V5 Research Benchmark Metrics Card */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={15} color="#3b82f6" /> V5 Multimodal Research Benchmark
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
                    Held-Out Test Set
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>MAE: <strong style={{ color: '#0f172a' }}>$77.74</strong></div>
                  <div>RMSE: <strong style={{ color: '#0f172a' }}>$159.11</strong></div>
                  <div>R²: <strong style={{ color: '#0f172a' }}>0.6841</strong></div>
                  <div>MAPE: <strong style={{ color: '#0f172a' }}>27.73%</strong></div>
                  <div>MedAE: <strong style={{ color: '#0f172a' }}>$34.26</strong></div>
                  <div>Coverage: <strong style={{ color: '#15803d' }}>96.63%</strong></div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: '1.4' }}>
                  Benchmark established on 5,050 aligned Austin, TX listings using LightGBM multimodal concatenation (CLIP ViT-B/32 visual representation, BGE-small text representation, 20 geographic distance features, and 95% nominal conformal prediction intervals). Cross-attention research model achieved R² 0.7114 / RMSE $152.10 in offline ablation. Metrics represent experimental benchmark evaluations, not a guarantee of future individual accuracy.
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Cpu size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>Ready for ML Valuation</h3>
              <p style={{ fontSize: '0.875rem', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0' }}>
                Fill out the property specifications on the left and click predict to evaluate through the V5 LightGBM multimodal pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimatorPage;
