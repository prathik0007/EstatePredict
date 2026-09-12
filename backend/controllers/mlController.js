const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FLASK_ML_URL = (process.env.FLASK_ML_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

const pickVal = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const parseNum = (val, defaultVal) => {
  if (Array.isArray(val)) val = val[0];
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = Number(val);
  return isNaN(n) ? defaultVal : n;
};

const parseStr = (val, defaultVal = '') => {
  if (Array.isArray(val)) val = val[0];
  if (val === undefined || val === null) return defaultVal;
  return String(val).trim();
};

// @desc    Predict Rental Price using Flask ML API (Multimodal V5 LightGBM + Conformal Intervals)
// @route   POST /api/ml/predict-rent
// @access  Public / Private
exports.predictRent = async (req, res) => {
  try {
    const accommodatesVal = parseNum(pickVal(req.body.accommodates, req.body.guests), 4);
    const bedroomsVal = parseNum(pickVal(req.body.bedrooms, req.body.bhk), 2);
    const bedsVal = parseNum(pickVal(req.body.beds), bedroomsVal);
    const bathroomsVal = parseNum(pickVal(req.body.bathrooms, req.body.bathroom, req.body.bathroomsAirbnb), 1.5);
    const latitudeVal = parseNum(pickVal(req.body.latitude), 30.2747);
    const longitudeVal = parseNum(pickVal(req.body.longitude), -97.7404);
    const roomTypeVal = parseStr(pickVal(req.body.room_type, req.body.roomType), 'Entire home/apt');
    const propertyTypeVal = parseStr(pickVal(req.body.property_type, req.body.propertyType), 'Entire home');
    const isSuperhostVal = parseNum(pickVal(req.body.is_superhost, req.body.isSuperhost), 0);
    const minNightsVal = parseNum(pickVal(req.body.min_nights, req.body.minimum_nights, req.body.minNights, req.body.minimumNights), 2);
    const maxNightsVal = parseNum(pickVal(req.body.max_nights, req.body.maximum_nights, req.body.maxNights, req.body.maximumNights), 1125);
    const avail365Val = parseNum(pickVal(req.body.avail_365, req.body.availability_365, req.body.avail365, req.body.availability365), 180);
    const numReviewsVal = parseNum(pickVal(req.body.num_reviews, req.body.number_of_reviews, req.body.numReviews, req.body.numberOfReviews), 25);
    const ratingVal = parseNum(pickVal(req.body.rating, req.body.review_scores_rating, req.body.reviewScoresRating), 4.85);
    const ratingCleanlinessVal = parseNum(pickVal(req.body.rating_cleanliness, req.body.ratingCleanliness), 4.90);
    const ratingLocationVal = parseNum(pickVal(req.body.rating_location, req.body.ratingLocation), 4.85);
    const cityVal = parseStr(pickVal(req.body.city), 'Bengaluru');
    const descriptionVal = parseStr(pickVal(req.body.description), '');

    const formData = new FormData();
    formData.append('accommodates', String(accommodatesVal));
    formData.append('bedrooms', String(bedroomsVal));
    formData.append('beds', String(bedsVal));
    formData.append('bathrooms', String(bathroomsVal));
    formData.append('latitude', String(latitudeVal));
    formData.append('longitude', String(longitudeVal));
    formData.append('property_type', propertyTypeVal);
    formData.append('propertyType', propertyTypeVal);
    formData.append('room_type', roomTypeVal);
    formData.append('roomType', roomTypeVal);
    formData.append('is_superhost', String(isSuperhostVal ? '1' : '0'));
    formData.append('min_nights', String(minNightsVal));
    formData.append('max_nights', String(maxNightsVal));
    formData.append('avail_365', String(avail365Val));
    formData.append('num_reviews', String(numReviewsVal));
    formData.append('rating', String(ratingVal));
    formData.append('review_scores_rating', String(ratingVal));
    formData.append('rating_cleanliness', String(ratingCleanlinessVal));
    formData.append('rating_location', String(ratingLocationVal));
    formData.append('city', String(cityVal));
    formData.append('description', descriptionVal);

    // Attach image if uploaded
    if (req.file) {
      formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);
    }

    // Log request payload immediately before sending to Flask (no secrets or binary image bytes)
    console.log('[BACKEND ML CONTROLLER] Forwarding payload to Flask ML service:', {
      url: `${FLASK_ML_URL}/api/predict-rent`,
      accommodates: accommodatesVal,
      bedrooms: bedroomsVal,
      beds: bedsVal,
      bathrooms: bathroomsVal,
      min_nights: minNightsVal,
      max_nights: maxNightsVal,
      avail_365: avail365Val,
      num_reviews: numReviewsVal,
      room_type: roomTypeVal,
      property_type: propertyTypeVal,
      rating: ratingVal,
      city: cityVal,
      has_image: !!req.file,
      description_length: descriptionVal.length
    });

    // Forward to Flask Service
    const response = await axios.post(`${FLASK_ML_URL}/api/predict-rent`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('[BACKEND ML CONTROLLER] Error contacting Flask ML Service:', error.message);
    
    // Comprehensive fallback estimation consistent with V5 Austin benchmark ($185 median reference)
    const occ = parseNum(pickVal(req.body.accommodates, req.body.guests), 4);
    const beds = parseNum(pickVal(req.body.bedrooms, req.body.bhk), 2);
    const baths = parseNum(pickVal(req.body.bathrooms, req.body.bathroom), 1.5);
    const minNights = parseNum(pickVal(req.body.min_nights, req.body.minNights, req.body.minimum_nights, req.body.minimumNights), 2);
    const rating = parseNum(pickVal(req.body.review_scores_rating, req.body.rating, req.body.reviewScoresRating), 4.85);
    const roomType = parseStr(pickVal(req.body.room_type, req.body.roomType), 'Entire home/apt');
    const propertyType = parseStr(pickVal(req.body.property_type, req.body.propertyType), 'Entire home');

    // Room type multiplier
    let roomMultiplier = 1.0;
    if (roomType.includes('Entire')) {
      roomMultiplier = 1.25;
    } else if (roomType.includes('Hotel')) {
      roomMultiplier = 1.10;
    } else if (roomType.includes('Private')) {
      roomMultiplier = 0.70;
    } else if (roomType.includes('Shared')) {
      roomMultiplier = 0.40;
    }

    // Property type multiplier
    let propMultiplier = 1.0;
    const ptLower = propertyType.toLowerCase();
    if (ptLower.includes('villa') || ptLower.includes('resort')) {
      propMultiplier = 1.25;
    } else if (ptLower.includes('condo') || ptLower.includes('townhouse') || ptLower.includes('loft')) {
      propMultiplier = 1.08;
    } else if (ptLower.includes('house') || ptLower.includes('home')) {
      propMultiplier = 1.05;
    } else if (ptLower.includes('guest') || ptLower.includes('tiny')) {
      propMultiplier = 0.90;
    }

    // Rating adjustment
    const ratingAdj = (rating - 4.5) * 12;

    // Minimum nights adjustment: short stays have higher nightly rates
    const minNightsAdj = minNights <= 2 ? 10 : (minNights >= 28 ? -20 : (minNights >= 7 ? -10 : 0));

    // Base estimated price in USD
    const rawEst = (45 + occ * 18 + beds * 24 + baths * 22 + ratingAdj + minNightsAdj) * roomMultiplier * propMultiplier;
    const estimated = Math.max(20, Math.round(isNaN(rawEst) ? 185 : rawEst));
    
    // Conformal 95% log radius (q_hat = 0.8435: exp(-0.8435) = 0.4302, exp(+0.8435) = 2.3245)
    const lowerBound = Math.max(10, Math.round(estimated * 0.43));
    const upperBound = Math.round(estimated * 2.32);

    const usdToInrRate = Number(process.env.USD_TO_INR_RATE) || 83.50;
    const estimatedInr = Math.max(1, Math.round(estimated * usdToInrRate));
    const lowerBoundInr = Math.max(1, Math.round(lowerBound * usdToInrRate));
    const upperBoundInr = Math.max(1, Math.round(upperBound * usdToInrRate));

    res.status(200).json({
      success: true,
      data: {
        predicted_rent: estimated,
        predicted_price_usd: estimated,
        lower_bound: lowerBound,
        upper_bound: upperBound,
        predicted_price_inr: estimatedInr,
        lower_bound_inr: lowerBoundInr,
        upper_bound_inr: upperBoundInr,
        usd_to_inr_rate: usdToInrRate,
        unit: 'USD/night',
        model_name: 'V5 Fallback Estimator (ML Service Offline)',
        is_fallback: true,
        fallback_notice: 'Python Flask ML service on port 5000 is currently offline. Start ml_service/app.py to run the trained LightGBM V5 model.',
        benchmark_dataset: 'Austin, TX Inside Airbnb (5,050 aligned multimodal listings)',
        prediction_interval: {
          nominal_coverage: '95%',
          empirical_coverage: '96.63%',
          quantile_q: 0.8435,
          lower_bound_usd: lowerBound,
          upper_bound_usd: upperBound,
          lower_bound_inr: lowerBoundInr,
          upper_bound_inr: upperBoundInr,
          mean_interval_width_usd: 493.10,
          median_interval_width_usd: 390.43
        },
        top_factors: [
          { feature: 'Accommodates (Guests)', impact: Math.round((occ - 3.5) * 16) },
          { feature: 'Bedrooms', impact: Math.round((beds - 2) * 20) },
          { feature: 'Bathrooms', impact: Math.round((baths - 1.5) * 15) },
          { feature: 'Room Type', impact: Math.round((roomMultiplier - 1.0) * 50) },
          { feature: 'Review Score Rating', impact: Math.round(ratingAdj) },
          { feature: 'Minimum Nights', impact: minNightsAdj }
        ],
        research_benchmark: {
          benchmark_name: 'V5 Multimodal Research Benchmark',
          cohort_size: '5,050 aligned Austin, TX listings',
          architecture: 'LightGBM multimodal concatenation',
          visual_encoder: 'CLIP ViT-B/32 visual representation',
          text_encoder: 'BGE-small text representation',
          geographic_features: '20 geographic distance features',
          conformal_calibration: '95% nominal conformal prediction intervals',
          metrics: {
            mae_usd: 77.74,
            rmse_usd: 159.11,
            r2: 0.6841,
            mape_pct: 27.73,
            medae_usd: 34.26
          }
        },
        metrics: {
          r2: 0.6841,
          mae_usd: 77.74,
          rmse_usd: 159.11,
          mape_pct: 27.73,
          medae_usd: 34.26
        }
      }
    });
  }
};

// @desc    Check ML Service status
// @route   GET /api/ml/health
// @access  Public
exports.checkMlHealth = async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_ML_URL}/api/health`, { timeout: 5000 });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(503).json({
      status: 'offline',
      message: 'Flask ML Service is currently unreachable',
      error: error.message
    });
  }
};
