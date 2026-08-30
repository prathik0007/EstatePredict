import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const CITY_COORDINATES = {
  'Mumbai': [19.0760, 72.8777],
  'Bangalore': [12.9716, 77.5946],
  'Delhi': [28.6139, 77.2090],
  'Hyderabad': [17.3850, 78.4867],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639]
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

const LocationPicker = ({ city = 'Mumbai', value = { lat: 19.0760, lng: 72.8777 }, onChange }) => {
  const [position, setPosition] = useState([value.lat, value.lng]);

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
        zoom={12}
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
