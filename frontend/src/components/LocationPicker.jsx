import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const CITY_COORDINATES = {
  'Downtown': [35.5951, -82.5515],
  'Montford': [35.6025, -82.5620],
  'West Asheville': [35.5785, -82.5930],
  'Biltmore Village': [35.5670, -82.5400],
  'Grove Park': [35.6180, -82.5480],
  'River Arts District': [35.5840, -82.5660],
  'North Asheville': [35.6200, -82.5550],
  'South Asheville': [35.5350, -82.5300]
};

function LocationMarker({ position, setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const LocationPicker = ({ city = 'Downtown', value = { lat: 35.5951, lng: -82.5515 }, onChange }) => {
  const [position, setPosition] = useState([value.lat || 35.5951, value.lng || -82.5515]);

  useEffect(() => {
    if (CITY_COORDINATES[city]) {
      const cityPos = CITY_COORDINATES[city];
      setPosition(cityPos);
      onChange({ lat: cityPos[0], lng: cityPos[1] });
    }
  }, [city]);

  return (
    <div style={{
      height: '300px',
      width: '100%',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      marginTop: '8px'
    }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
      </MapContainer>
      <div style={{ background: '#f8fafc', padding: '6px 12px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid var(--border-color)' }}>
        📍 Click anywhere on the map to place your property pin ({position[0]?.toFixed(4)}, {position[1]?.toFixed(4)})
      </div>
    </div>
  );
};

export default LocationPicker;
