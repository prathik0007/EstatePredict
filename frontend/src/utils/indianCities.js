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
    country: 'India',
    lat: 18.5204,
    lng: 73.8567
  }
].map(c => ({ country: 'India', ...c }));

export const INDIAN_CITY_NAMES = INDIAN_CITIES.map(c => c.city);
export const INDIAN_STATES = Array.from(new Set(INDIAN_CITIES.map(c => c.state)));

/**
 * Supported USA Cities & Benchmark Districts (Aligned with Austin & Asheville Inside Airbnb Datasets)
 */
export const USA_CITIES = [
  {
    city: 'Austin',
    state: 'Texas',
    country: 'USA',
    pincode: '78701',
    lat: 30.2672,
    lng: -97.7431
  },
  {
    city: 'Downtown Austin',
    state: 'Texas',
    country: 'USA',
    pincode: '78701',
    lat: 30.2747,
    lng: -97.7404
  },
  {
    city: 'South Congress',
    state: 'Texas',
    country: 'USA',
    pincode: '78704',
    lat: 30.2505,
    lng: -97.7497
  },
  {
    city: 'East Austin',
    state: 'Texas',
    country: 'USA',
    pincode: '78702',
    lat: 30.2625,
    lng: -97.7215
  },
  {
    city: 'The Domain',
    state: 'Texas',
    country: 'USA',
    pincode: '78758',
    lat: 30.4014,
    lng: -97.7247
  },
  {
    city: 'Zilker',
    state: 'Texas',
    country: 'USA',
    pincode: '78704',
    lat: 30.2670,
    lng: -97.7730
  },
  {
    city: 'UT Austin / Campus',
    state: 'Texas',
    country: 'USA',
    pincode: '78712',
    lat: 30.2849,
    lng: -97.7341
  },
  {
    city: 'Asheville',
    state: 'North Carolina',
    country: 'USA',
    pincode: '28801',
    lat: 35.5951,
    lng: -82.5515
  },
  {
    city: 'New York',
    state: 'New York',
    country: 'USA',
    pincode: '10001',
    lat: 40.7128,
    lng: -74.0060
  },
  {
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    pincode: '94102',
    lat: 37.7749,
    lng: -122.4194
  },
  {
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    pincode: '90012',
    lat: 34.0522,
    lng: -118.2437
  },
  {
    city: 'Chicago',
    state: 'Illinois',
    country: 'USA',
    pincode: '60601',
    lat: 41.8781,
    lng: -87.6298
  },
  {
    city: 'Seattle',
    state: 'Washington',
    country: 'USA',
    pincode: '98101',
    lat: 47.6062,
    lng: -122.3321
  },
  {
    city: 'Boston',
    state: 'Massachusetts',
    country: 'USA',
    pincode: '02108',
    lat: 42.3601,
    lng: -71.0589
  }
];

export const USA_CITY_NAMES = USA_CITIES.map(c => c.city);
export const USA_STATES = Array.from(new Set(USA_CITIES.map(c => c.state)));

export const ALL_CITIES = [...INDIAN_CITIES, ...USA_CITIES];
export const ALL_CITY_NAMES = ALL_CITIES.map(c => c.city);
export const ALL_STATES = Array.from(new Set(ALL_CITIES.map(c => c.state)));

export const getCityData = (cityName) => {
  if (!cityName) return null;
  const lower = cityName.trim().toLowerCase();
  return ALL_CITIES.find(c => c.city.toLowerCase() === lower) || null;
};


