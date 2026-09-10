import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const CITY_COORDINATES = {
  'Downtown Austin': [30.2747, -97.7404],
  'Downtown': [30.2747, -97.7404],
  'South Congress': [30.2505, -97.7497],
  'East Austin': [30.2625, -97.7215],
  'Zilker / Barton Hills': [30.2670, -97.7730],
  'The Domain': [30.4014, -97.7247],
  'UT Austin / Campus': [30.2849, -97.7341],
  'South Lamar': [30.2510, -97.7610],
  'Mueller': [30.3015, -97.7050],
  'Hyde Park': [30.3050, -97.7300],
  'Rainey Street': [30.2635, -97.7397],
  'Austin Airport': [30.1975, -97.6664]
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

const LocationPicker = ({ city = 'Downtown Austin', value = { lat: 30.2747, lng: -97.7404 }, onChange }) => {
  const [position, setPosition] = useState([value.lat || 30.2747, value.lng || -97.7404]);

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
