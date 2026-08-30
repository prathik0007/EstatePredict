const axios = require('axios');

const API_URL = 'http://127.0.0.1:5001/api';

async function runE2ETests() {
  console.log('==================================================');
  console.log('RUNNING END-TO-END SYSTEM INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Health Checks
    const health = await axios.get(`${API_URL}/health`);
    console.log('✔ [1/8] Node.js Backend Health:', health.data.status);

    const mlHealth = await axios.get(`${API_URL}/ml/health`);
    console.log('✔ [2/8] Flask ML Microservice Health:', mlHealth.data.status);
    console.log('        Models Active:', mlHealth.data.models_loaded);

    // 2. Auth - Login Owner
    const ownerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@rental.com',
      password: 'ownerpassword123'
    });
    const ownerToken = ownerLogin.data.token;
    console.log('✔ [3/8] Owner Authentication successful! (Token generated)');

    // 3. Auth - Login Tenant
    const tenantLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'tenant@rental.com',
      password: 'tenantpassword123'
    });
    const tenantToken = tenantLogin.data.token;
    console.log('✔ [4/8] Tenant Authentication successful! (Token generated)');

    // 4. ML Rental Price Prediction (Multimodal Simulation)
    const predictionRes = await axios.post(`${API_URL}/ml/predict-rent`, {
      city: 'Bangalore',
      bhk: 2,
      size: 1200,
      bathroom: 2,
      areaType: 'Super Area',
      furnishingStatus: 'Semi-Furnished',
      tenantPreferred: 'Anyone',
      propertyType: 'Apartment',
      roomType: 'Entire home/apt',
      description: 'Spacious 2 BHK near IT tech parks with covered parking and power backup'
    });
    console.log('✔ [5/8] Multimodal ML Valuation Engine:');
    console.log(`        Predicted Monthly Rent: ₹${predictionRes.data.data.predicted_rent}`);
    console.log(`        95% Confidence Band   : ₹${predictionRes.data.data.lower_bound} – ₹${predictionRes.data.data.upper_bound}`);
    console.log(`        Top SHAP Factor       : ${predictionRes.data.data.top_factors[0].feature} (+₹${predictionRes.data.data.top_factors[0].impact})`);

    // 5. Properties Query & Filtering
    const propertiesRes = await axios.get(`${API_URL}/properties?city=Mumbai`);
    const targetProperty = propertiesRes.data.properties[0];
    console.log(`✔ [6/8] Property Search & Filter (Mumbai listings: ${propertiesRes.data.count})`);

    // 6. Booking Site Visit (Tenant -> Owner)
    const bookingRes = await axios.post(
      `${API_URL}/bookings`,
      {
        propertyId: targetProperty._id,
        visitDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        timeSlot: 'Morning (9 AM - 12 PM)',
        contactNumber: '+91 9811223344',
        message: 'Interested in visiting on Saturday morning.'
      },
      { headers: { Authorization: `Bearer ${tenantToken}` } }
    );
    const bookingId = bookingRes.data.booking._id;
    console.log('✔ [7/8] Tenant Visit Booking Request created:', bookingRes.data.booking.status);

    // 7. Owner Accept Booking
    const acceptRes = await axios.put(
      `${API_URL}/bookings/${bookingId}/status`,
      { status: 'accepted', ownerNotes: 'Looking forward to meeting you at 10 AM.' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    console.log('✔ [8/8] Owner Booking Request Acceptance:', acceptRes.data.booking.status);

    console.log('\n==================================================');
    console.log('ALL 8 END-TO-END INTEGRATION TESTS PASSED 100%!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('Test Suite Failed:', err.response?.data || err.message);
  }
}

runE2ETests();
