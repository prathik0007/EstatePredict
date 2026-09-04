import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ArrowRight,
  SlidersHorizontal,
  Home,
  CheckCircle2
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import MapViewer from '../components/MapViewer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('All');
  const [searchBedrooms, setSearchBedrooms] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/properties?limit=6');
        if (res.data.success) {
          setProperties(res.data.properties);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const params = new URLSearchParams();
    if (searchCity !== 'All') params.append('city', searchCity);
    if (searchBedrooms !== 'All') params.append('bedrooms', searchBedrooms);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#ffffff',
        padding: '80px 0 90px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <Link to="/estimator" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              padding: '8px 20px',
              borderRadius: '30px',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#93c5fd',
              marginBottom: '20px',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}>
              <Sparkles size={16} color="#60a5fa" /> Explainable Multimodal AI Price Intelligence →
            </Link>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              fontWeight: '900',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '20px'
            }}>
              Discover Verified Rentals & Predict Fair Nightly Prices with <span style={{ color: '#38bdf8' }}>Machine Learning</span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: '#cbd5e1',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}>
              Direct connection between verified hosts and guests with calibrated 95% prediction intervals and SHAP feature explainability.
            </p>

            {/* Hero Quick Search Box */}
            <form onSubmit={handleSearchSubmit} style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto',
              gap: '10px',
              alignItems: 'center'
            }}>
              {/* Neighborhood selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                <MapPin size={18} color="#3b82f6" />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '600', color: '#1e293b', width: '100%', fontSize: '0.9rem' }}
                >
                  <option value="All">All Neighborhoods</option>
                  <option value="Downtown">Downtown Asheville</option>
                  <option value="Montford">Montford</option>
                  <option value="West Asheville">West Asheville</option>
                  <option value="Biltmore Village">Biltmore Village</option>
                  <option value="Grove Park">Grove Park</option>
                  <option value="River Arts District">River Arts District</option>
                  <option value="North Asheville">North Asheville</option>
                  <option value="South Asheville">South Asheville</option>
                </select>
              </div>

              {/* Bedrooms selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                <Home size={18} color="#3b82f6" />
                <select
                  value={searchBedrooms}
                  onChange={(e) => setSearchBedrooms(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '600', color: '#1e293b', width: '100%', fontSize: '0.9rem' }}
                >
                  <option value="All">Any Bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>

              {/* Keyword text search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                <Search size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Neighborhood, title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '500', color: '#1e293b', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              {/* Search Action Button */}
              <button type="submit" className="btn btn-primary btn-lg" style={{ height: '100%' }}>
                <Search size={18} /> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Research Multimodal Showcase Banner */}
      <section style={{ padding: '40px 0', background: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '12px' }}>
                <Cpu size={24} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>HistGradientBoosting</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>log1p target transformation</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '12px' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>Calibrated 95% Interval</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Empirical coverage: 93.70%</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '12px', borderRadius: '12px' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>SHAP Explainability</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Transparent factor attribution</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fffbeb', color: '#d97706', padding: '12px', borderRadius: '12px' }}>
                <MapPin size={24} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>OpenStreetMap</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Asheville Leaflet geolocation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Top Handpicked Listings
              </span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginTop: '4px' }}>
                Featured Properties For Rent
              </h2>
            </div>
            <Link to="/properties" className="btn btn-outline-primary" style={{ fontWeight: '700' }}>
              Browse All Listings <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: '600' }}>
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              No properties found.
            </div>
          ) : (
            <div className="grid-properties">
              {properties.map((prop) => (
                <PropertyCard key={prop._id} property={prop} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Interactive Map Explorer Preview */}
      <section style={{ padding: '40px 0 80px', background: '#f1f5f9' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 32px' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a' }}>
              Explore Properties on OpenStreetMap
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              View verified Airbnb properties across Asheville, NC (Downtown, Montford, West Asheville, Biltmore Village) directly on Leaflet.js
            </p>
          </div>

          <MapViewer properties={properties} height="480px" />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
