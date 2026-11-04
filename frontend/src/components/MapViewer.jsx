import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { getPropertyImageUrl } from '../utils/imageUtils';
import { CITY_COORDINATES } from './LocationPicker';

// Fix standard leaflet marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically re-center map when coordinates change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  return null;
};

const MapViewer = ({ properties = [], singleProperty = null, selectedCity = null, height = '450px', zoom = 12 }) => {
  // Determine center coordinates
  let center = [12.9716, 77.5946]; // Default: Bangalore, India

  if (singleProperty && singleProperty.location?.coordinates?.lat) {
    center = [
      singleProperty.location.coordinates.lat,
      singleProperty.location.coordinates.lng
    ];
  } else if (properties.length > 0 && properties[0].location?.coordinates?.lat) {
    center = [
      properties[0].location.coordinates.lat,
      properties[0].location.coordinates.lng
    ];
  } else if (selectedCity && CITY_COORDINATES[selectedCity]) {
    center = CITY_COORDINATES[selectedCity];
  }

  const itemsToRender = singleProperty ? [singleProperty] : properties;

  return (
    <div style={{
      height,
      width: '100%',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
      position: 'relative',
      zIndex: 1
    }}>
      <MapContainer
        center={center}
        zoom={singleProperty ? 14 : zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={singleProperty ? 14 : zoom} />

        {itemsToRender.map((prop) => {
          const lat = prop.location?.coordinates?.lat;
          const lng = prop.location?.coordinates?.lng;
          if (!lat || !lng) return null;

          return (
            <Marker key={prop._id || Math.random()} position={[lat, lng]}>
              <Popup>
                <div style={{ minWidth: '190px' }}>
                  <img
                    src={getPropertyImageUrl(prop.images && prop.images[0])}
                    alt={prop.title}
                    style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300';
                    }}
                  />
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                    {prop.title}
                  </h4>
                  <div style={{ color: '#2563eb', fontWeight: '800', fontSize: '0.95rem', marginBottom: '4px' }}>
                    ${Number(prop.price).toLocaleString('en-US')}/night
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    📍 {prop.location?.city || 'India'}{prop.location?.state ? `, ${prop.location.state}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                    {prop.bedrooms || prop.bhk || 2} Beds • {prop.bathrooms || prop.bathroom || 1} Baths • {prop.accommodates || 4} Guests
                  </div>
                  <Link
                    to={`/properties/${prop._id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#3b82f6',
                      color: '#ffffff',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    View Listing
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapViewer;
