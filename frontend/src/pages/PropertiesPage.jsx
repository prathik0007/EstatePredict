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
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || searchParams.get('bhk') || 'All');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || 'All');
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || 'All');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city !== 'All') params.append('city', city);
      if (bedrooms !== 'All') {
        params.append('bedrooms', bedrooms);
        params.append('bhk', bedrooms);
      }
      if (propertyType !== 'All') params.append('propertyType', propertyType);
      if (roomType !== 'All') params.append('roomType', roomType);
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
  }, [city, bedrooms, propertyType, roomType, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleResetFilters = () => {
    setCity('All');
    setBedrooms('All');
    setPropertyType('All');
    setRoomType('All');
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
            Find Verified Asheville Rentals
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Showing {totalCount} verified rental listings (Asheville, NC)
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

          {/* Neighborhood */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
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

          {/* Bedrooms */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Bedrooms</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
          </div>

          {/* Property Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Types</option>
              <option value="Entire rental unit">Entire rental unit</option>
              <option value="Entire home">Entire home</option>
              <option value="Entire guest suite">Entire guest suite</option>
              <option value="Entire townhouse">Entire townhouse</option>
              <option value="Private room in home">Private room in home</option>
            </select>
          </div>

          {/* Room Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="All">All Room Types</option>
              <option value="Entire home/apt">Entire home/apt</option>
              <option value="Private room">Private room</option>
              <option value="Shared room">Shared room</option>
              <option value="Hotel room">Hotel room</option>
            </select>
          </div>

          {/* Sort */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select" style={{ padding: '0.55rem 0.85rem' }}>
              <option value="newest">Latest Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
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
