import React, { useState } from 'react';
import { Sparkles, TrendingUp, ShieldCheck, BarChart3, CheckCircle2, X, RefreshCw, Info } from 'lucide-react';
import mlApi from '../services/mlApi';
import { usdToInr, USD_TO_INR_RATE } from '../utils/currency';

const AiPriceEstimatorModal = ({
  isOpen,
  onClose,
  initialData = {},
  imageFile = null,
  onApplyPrice = null
}) => {
  const [formData, setFormData] = useState({
    city: initialData.city || 'Mumbai',
    accommodates: initialData.accommodates || 4,
    bedrooms: initialData.bedrooms || initialData.bhk || 2,
    bathrooms: initialData.bathrooms || initialData.bathroom || 2,
    min_nights: initialData.minNights || 2,
    room_type: initialData.roomType || 'Entire home/apt',
    property_type: initialData.propertyType || 'Entire rental unit',
    review_scores_rating: initialData.reviewScoresRating || 4.90,
    description: initialData.description || ''
  });

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (formData.review_scores_rating !== undefined) {
        data.append('rating', formData.review_scores_rating);
      }
      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await mlApi.post('/predict-rent', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success && res.data.data) {
        setPredictionResult(res.data.data);
      } else {
        setError('Invalid prediction response received from ML server.');
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.error || err.response.data?.message || err.message;
        setError(`ML Service Error (HTTP ${status}): ${msg}`);
      } else if (err.request) {
        setError('Connection failure: Unable to reach the Python Flask ML service on Render. Please verify the service is active.');
      } else {
        setError(`Unable to fetch AI prediction: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>AI Rental Price Valuation</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                HistGradientBoosting (log1p) & Conformal Prediction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Neighborhood / Area</label>
            <select name="city" value={formData.city} onChange={handleChange} className="form-select" style={{ padding: '0.5rem' }}>
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Accommodates</label>
            <input type="number" name="accommodates" min="1" max="16" value={formData.accommodates} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Bedrooms</label>
            <input type="number" name="bedrooms" min="0" max="10" value={formData.bedrooms} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Bathrooms</label>
            <input type="number" step="0.5" name="bathrooms" min="1" max="10" value={formData.bathrooms} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Min Nights</label>
            <input type="number" name="min_nights" min="1" max="30" value={formData.min_nights} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="btn btn-accent"
          style={{ width: '100%', marginBottom: '20px', fontWeight: '700' }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="pulse-badge" /> Computing Multimodal Predictions...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Predict Rental Market Rate
            </>
          )}
        </button>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Prediction Results */}
        {predictionResult && (
          <div className="ai-prediction-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PREDICTED RENTAL PRICE
                </span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
                  ₹{usdToInr(predictionResult.predicted_rent).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  USD: ${Number(predictionResult.predicted_rent).toFixed(2)} (1 USD = ₹{USD_TO_INR_RATE})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                  <ShieldCheck size={12} /> EMPIRICAL COVERAGE: 93.70%
                </span>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#059669', marginTop: '4px' }}>
                  Calibrated 95% Prediction Interval
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#334155', marginTop: '2px' }}>
                  ₹{usdToInr(predictionResult.lower_bound).toLocaleString('en-IN')} – ₹{usdToInr(predictionResult.upper_bound).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Top Influencing Factors (SHAP) */}
            {predictionResult.top_factors && predictionResult.top_factors.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BarChart3 size={14} color="#7c3aed" /> SHAP Feature Attribution:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {predictionResult.top_factors.map((factor, idx) => {
                    const impactNum = typeof factor.impact === 'number' ? factor.impact : parseFloat(factor.impact);
                    const isNearZero = isNaN(impactNum) || Math.abs(impactNum) < 0.005;
                    const formattedVal = isNearZero ? '0' : (impactNum > 0 ? `+${impactNum}` : `${impactNum}`);
                    const isPositive = impactNum >= 0;

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>{factor.feature}</span>
                        <span style={{
                          fontWeight: '700',
                          color: isPositive ? '#16a34a' : '#dc2626',
                          background: isPositive ? '#dcfce7' : '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {formattedVal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action to apply price if inside listing wizard */}
            {onApplyPrice && (
              <button
                onClick={() => {
                  onApplyPrice(predictionResult.predicted_rent, predictionResult);
                  onClose();
                }}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: '16px', fontWeight: '700' }}
              >
                <CheckCircle2 size={16} /> Apply AI Price to Listing Form
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiPriceEstimatorModal;
