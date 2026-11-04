/**
 * Exactly 8 Supported Indian Cities for EstatePredict Property Listings
 * Contains City, State, Default PIN Code, and Center Coordinates (Latitude, Longitude)
 */
export const INDIAN_CITIES = [
  {
    city: 'Mangalore',
    state: 'Karnataka',
    pincode: '575001',
    lat: 12.9141,
    lng: 74.8560
  },
  {
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    lat: 12.9716,
    lng: 77.5946
  },
  {
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570001',
    lat: 12.2958,
    lng: 76.6394
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    lat: 28.7041,
    lng: 77.1025
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    lat: 17.3850,
    lng: 78.4867
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    lat: 13.0827,
    lng: 80.2707
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    lat: 18.5204,
    lng: 73.8567
  }
];

export const INDIAN_CITY_NAMES = INDIAN_CITIES.map(c => c.city);

export const INDIAN_STATES = Array.from(new Set(INDIAN_CITIES.map(c => c.state)));

export const getCityData = (cityName) => {
  if (!cityName) return null;
  return INDIAN_CITIES.find(c => c.city.toLowerCase() === cityName.trim().toLowerCase()) || null;
};
