import React from 'react';
import { Building2, Heart, Shield, Cpu, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      borderTop: '1px solid #1e293b',
      marginTop: 'auto',
      padding: '48px 0 24px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          marginBottom: '36px'
        }}>
          {/* Col 1: Brand info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', marginBottom: '12px' }}>
              <div style={{ background: '#3b82f6', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Building2 size={20} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>EstatePredict</span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#64748b' }}>
              Next-generation Online Property Rental and Listing Management System powered by Explainable Multimodal Machine Learning.
            </p>
          </div>

          {/* Col 2: Research Modules */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} color="#38bdf8" /> Multimodal V3 Research Pipeline
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>HistGradientBoostingRegressor (log1p transform)</li>
              <li>Calibrated 95% Prediction Interval (93.70% coverage)</li>
              <li>SHAP Feature Explainability & Attribution</li>
              <li>all-MiniLM-L6-v2 Text Representation (384-d)</li>
              <li>EfficientNet-B0 Visual Representation (1,280-d)</li>
              <li>Asheville, NC Inside Airbnb Benchmark (N = 1,800)</li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px' }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/properties" style={{ color: '#94a3b8' }}>Search & Filter Listings</a></li>
              <li><a href="/estimator" style={{ color: '#94a3b8' }}>AI Nightly Rate Valuation</a></li>
              <li><a href="/login" style={{ color: '#94a3b8' }}>Host & Guest Portals</a></li>
              <li><a href="/admin/dashboard" style={{ color: '#94a3b8' }}>Platform Administration</a></li>
            </ul>
          </div>

          {/* Col 4: Tech Stack Badge */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="#10b981" /> Architecture
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Built with React.js, Node.js, Express, MongoDB, Python Flask, and Leaflet OpenStreetMap.
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #1e293b',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: '#475569'
        }}>
          <div>© {new Date().getFullYear()} EstatePredict. Multimodal V3 Research Benchmark. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
