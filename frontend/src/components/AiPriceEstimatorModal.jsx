import React, { useState } from 'react';
import { Sparkles, TrendingUp, ShieldCheck, BarChart3, CheckCircle2, X, RefreshCw, Info } from 'lucide-react';
import mlApi from '../services/mlApi';

const AiPriceEstimatorModal = ({
  isOpen,
  onClose,
  initialData = {},
  imageFile = null,
  onApplyPrice = null
}) => {
  const [formData, setFormData] = useState({
    city: initialData.city || 'Mumbai',
    bhk: initialData.bhk || 2,
    size: initialData.size || 1000,
    bathroom: initialData.bathroom || 2,
    areaType: initialData.areaType || 'Super Area',
    furnishingStatus: initialData.furnishingStatus || 'Semi-Furnished',
    tenantPreferred: initialData.tenantPreferred || 'Bachelors',
    propertyType: initialData.propertyType || 'Apartment',
    roomType: initialData.roomType || 'Entire home/apt',
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
      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await mlApi.post('/predict-rent', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setPredictionResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch AI prediction. Please try again.');
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
                Multimodal Random Forest & Conformal Prediction Engine
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>City</label>
            <select name="city" value={formData.city} onChange={handleChange} className="form-select" style={{ padding: '0.5rem' }}>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>BHK</label>
            <input type="number" name="bhk" min="1" max="10" value={formData.bhk} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Size (sq.ft)</label>
            <input type="number" name="size" min="100" max="20000" value={formData.size} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Bathrooms</label>
            <input type="number" name="bathroom" min="1" max="10" value={formData.bathroom} onChange={handleChange} className="form-input" style={{ padding: '0.5rem' }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Furnishing</label>
            <select name="furnishingStatus" value={formData.furnishingStatus} onChange={handleChange} className="form-select" style={{ padding: '0.5rem' }}>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
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
              <RefreshCw size={16} className="pulse-badge" /> Computing AI Multimodal Features...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Calculate Accurate Market Rent
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Predicted Monthly Rent
                </span>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
                  ₹{Number(predictionResult.predicted_rent).toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}> / month</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> 95% Confidence Interval
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                  ₹{Number(predictionResult.lower_bound).toLocaleString('en-IN')} – ₹{Number(predictionResult.upper_bound).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Top Influencing Factors (SHAP) */}
            {predictionResult.top_factors && predictionResult.top_factors.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BarChart3 size={14} color="#7c3aed" /> SHAP Feature Attribution Insights:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {predictionResult.top_factors.map((factor, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>{factor.feature}</span>
                      <span style={{
                        fontWeight: '700',
                        color: factor.impact >= 0 ? '#16a34a' : '#dc2626',
                        background: factor.impact >= 0 ? '#dcfce7' : '#fee2e2',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {factor.impact >= 0 ? `+₹${factor.impact}` : `-₹${Math.abs(factor.impact)}`}
                      </span>
                    </div>
                  ))}
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
