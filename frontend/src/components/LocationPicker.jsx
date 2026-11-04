import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { INDIAN_CITIES } from '../utils/indianCities';

// Fix standard Leaflet marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const CITY_COORDINATES = {
  // 8 Supported Indian Cities
  'Mangalore': [12.9141, 74.8560],
  'Bangalore': [12.9716, 77.5946],
  'Mysore': [12.2958, 76.6394],
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Hyderabad': [17.3850, 78.4867],
  'Chennai': [13.0827, 80.2707],
  'Pune': [18.5204, 73.8567],
  // Legacy / USA cities for backward compatibility
  'Asheville': [35.5951, -82.5515],
  'Downtown Austin': [30.2747, -97.7404],
  'Austin': [30.2747, -97.7404],
  'Downtown': [30.2747, -97.7404],
  'South Congress': [30.2505, -97.7497],
  'East Austin': [30.2625, -97.7215],
  'Zilker / Barton Hills': [30.2670, -97.7730],
  'The Domain': [30.4014, -97.7247],
  'UT Austin / Campus': [30.2849, -97.7341]
};

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onChange({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) });
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const LocationPicker = ({ city = 'Bangalore', value = { lat: 12.9716, lng: 77.5946 }, onChange }) => {
  const initialLat = value?.lat || (CITY_COORDINATES[city] ? CITY_COORDINATES[city][0] : 12.9716);
  const initialLng = value?.lng || (CITY_COORDINATES[city] ? CITY_COORDINATES[city][1] : 77.5946);
  const [position, setPosition] = useState([initialLat, initialLng]);

  useEffect(() => {
    if (city && CITY_COORDINATES[city]) {
      const cityPos = CITY_COORDINATES[city];
      setPosition(cityPos);
      onChange({ lat: cityPos[0], lng: cityPos[1] });
    }
  }, [city]);

  return (
    <div style={{
      height: '320px',
      width: '100%',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      marginTop: '8px',
      position: 'relative'
    }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={position} />
        <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
      </MapContainer>
      <div style={{
        background: '#f8fafc',
        padding: '8px 12px',
        fontSize: '0.775rem',
        color: '#475569',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>📍 Click or drag anywhere on the map to place the property pin</span>
        <span style={{ fontWeight: '600', color: '#1e293b' }}>
          Lat: {position[0]?.toFixed(4)}, Lng: {position[1]?.toFixed(4)}
        </span>
      </div>
    </div>
  );
};

export default LocationPicker;
