import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Map, Grid, RefreshCw, X, SlidersHorizontal } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import MapViewer from '../components/MapViewer';
import api from '../services/api';

const PropertiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'split'
  const [totalCount, setTotalCount] = useState(0);

  // Filters State initialized from searchParams
  const [city, setCity] = useState(searchParams.get('city') || 'All');
  const [bhk, setBhk] = useState(searchParams.get('bhk') || 'All');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || 'All');
  const [furnishingStatus, setFurnishingStatus] = useState(searchParams.get('furnishingStatus') || 'All');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city !== 'All') params.append('city', city);
      if (bhk !== 'All') params.append('bhk', bhk);
      if (propertyType !== 'All') params.append('propertyType', propertyType);
      if (furnishingStatus !== 'All') params.append('furnishingStatus', furnishingStatus);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/properties?${params.toString()}`);
      if (res.data.success) {
        setProperties(res.data.properties);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [city, bhk, propertyType, furnishingStatus, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleResetFilters = () => {
    setCity('All');
    setBhk('All');
    setPropertyType('All');
    setFurnishingStatus('All');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setSort('newest');
  };

  return (
    <div className="container" style={{ padding: '36px 1.5rem 64px' }}>
      {/* Title & View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Find Your Next Home
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Showing {totalCount} verified rental properties
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? '#0f172a' : '#64748b',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Grid size={16} /> Grid View
          </button>
          <button
            onClick={() => setViewMode('split')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'split' ? '#ffffff' : 'transparent',
              color: viewMode === 'split' ? '#0f172a' : '#64748b',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'split' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Map size={16} /> Map Split View
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr)) auto',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          {/* City */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
            </select>
          </div>

          {/* BHK */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={bhk} onChange={(e) => setBhk(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          {/* Property Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Condominium">Condominium</option>
            </select>
          </div>

          {/* Furnishing */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={furnishingStatus} onChange={(e) => setFurnishingStatus(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Furnishing</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Sort */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="newest">Latest Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="size_desc">Size: Largest First</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={16} /> Filter
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-sm" title="Reset Filters">
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: '600' }}>
          Loading listings...
        </div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>No properties matched your criteria</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>Try adjusting your filters or resetting the search.</p>
          <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'split' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '750px', overflowY: 'auto', paddingRight: '8px' }}>
            {properties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
          <div style={{ position: 'sticky', top: '90px', height: '750px' }}>
            <MapViewer properties={properties} height="100%" />
          </div>
        </div>
      ) : (
        <div className="grid-properties">
          {properties.map((prop) => (
            <PropertyCard key={prop._id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
