from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Ensure current dir is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from prediction_service import predictor

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET", "POST", "OPTIONS"], strict_slashes=False)
@app.route("/api/ml/health", methods=["GET", "POST", "OPTIONS"], strict_slashes=False)
@app.route("/health", methods=["GET", "POST", "OPTIONS"], strict_slashes=False)
def health_check():
    if request.method == "OPTIONS":
        return "", 200
    return jsonify({
        "status": "healthy",
        "service": "Multimodal V5 Rental Price Prediction ML Service",
        "benchmark": "Austin, TX Inside Airbnb (5,050 Listings)",
        "model": "LightGBM Multimodal Concatenation (V5)",
        "models_loaded": {
            "rental_price_model": predictor.lgb_multimodal_concat is not None,
            "tab_geo_fallback_model": predictor.lgb_tab_geo is not None,
            "conformal_predictor": True,
            "text_encoder": predictor.text_model is not None,
            "image_encoder": predictor.image_model is not None,
            "shap_attribution": predictor.explainer is not None
        }
    }), 200

@app.route("/api/predict-rent", methods=["POST", "OPTIONS"], strict_slashes=False)
@app.route("/api/ml/predict-rent", methods=["POST", "OPTIONS"], strict_slashes=False)
@app.route("/predict-rent", methods=["POST", "OPTIONS"], strict_slashes=False)
def predict_rent_endpoint():
    if request.method == "OPTIONS":
        return "", 200
    try:
        # Check if json or multipart/form-data
        if request.is_json:
            data = request.get_json(silent=True) or {}
            image_file = None
        elif request.form:
            data = request.form.to_dict()
            image_file = request.files.get("image")
        else:
            data = request.get_json(silent=True) or request.form.to_dict() or {}
            image_file = request.files.get("image") if request.files else None

        city_coords = {
            'Downtown Austin': (30.2747, -97.7404),
            'Downtown': (30.2747, -97.7404),
            'South Congress': (30.2505, -97.7497),
            'East Austin': (30.2625, -97.7215),
            'Zilker / Barton Hills': (30.2670, -97.7730),
            'The Domain': (30.4014, -97.7247),
            'UT Austin / Campus': (30.2849, -97.7341),
            'South Lamar': (30.2510, -97.7610),
            'Mueller': (30.3015, -97.7050),
            'Hyde Park': (30.3050, -97.7300),
            'Rainey Street / Convention Center': (30.2635, -97.7397),
            'Austin Airport': (30.1975, -97.6664),
            # Legacy aliases default to central Austin
            'Mumbai': (30.2747, -97.7404),
            'Bengaluru': (30.2747, -97.7404),
            'Hyderabad': (30.2747, -97.7404),
            'Chennai': (30.2747, -97.7404),
            'Delhi': (30.2747, -97.7404),
            'Kolkata': (30.2747, -97.7404),
            'Pune': (30.2747, -97.7404),
            'Ahmedabad': (30.2747, -97.7404),
            'Jaipur': (30.2747, -97.7404),
            'Lucknow': (30.2747, -97.7404),
            'Kochi': (30.2747, -97.7404),
            'Mangaluru': (30.2747, -97.7404),
            'Mysuru': (30.2747, -97.7404)
        }
        city = data.get("city", "Bengaluru")
        default_lat, default_lng = city_coords.get(city, (30.2747, -97.7404))

        accommodates = float(data.get("accommodates", data.get("guests", 4)))
        bedrooms = float(data.get("bedrooms", data.get("bhk", 2)))
        beds = float(data.get("beds", bedrooms))
        bathrooms = float(data.get("bathrooms", data.get("bathroom", 1.5)))
        latitude = float(data.get("latitude", default_lat))
        longitude = float(data.get("longitude", default_lng))
        room_type = data.get("room_type", "Entire home/apt")
        property_type = data.get("property_type", "Entire home")
        is_superhost = int(data.get("is_superhost", 0))
        min_nights = float(data.get("min_nights", data.get("minimum_nights", 2)))
        max_nights = float(data.get("max_nights", data.get("maximum_nights", 1125)))
        avail_365 = float(data.get("avail_365", data.get("availability_365", 180)))
        num_reviews = float(data.get("num_reviews", data.get("number_of_reviews", 25)))
        rating_raw = data.get("rating") or data.get("review_scores_rating") or data.get("reviewScoresRating") or 4.85
        rating = float(rating_raw)
        rating_cleanliness = float(data.get("rating_cleanliness", 4.90))
        rating_location = float(data.get("rating_location", 4.85))
        identity_verified = int(data.get("host_identity_verified", 1))
        instant_bookable = int(data.get("instant_bookable", 0))
        description = data.get("description", "")

        result = predictor.predict(
            accommodates=accommodates,
            bathrooms=bathrooms,
            bedrooms=bedrooms,
            beds=beds,
            latitude=latitude,
            longitude=longitude,
            room_type=room_type,
            property_type=property_type,
            is_superhost=is_superhost,
            min_nights=min_nights,
            max_nights=max_nights,
            avail_365=avail_365,
            num_reviews=num_reviews,
            rating=rating,
            rating_cleanliness=rating_cleanliness,
            rating_location=rating_location,
            identity_verified=identity_verified,
            instant_bookable=instant_bookable,
            description=description,
            image_file=image_file
        )

        return jsonify({
            "success": True,
            "data": result
        }), 200

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Multimodal V5 ML Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
