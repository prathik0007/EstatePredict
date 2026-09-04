from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Ensure current dir is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from prediction_service import predictor

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Multimodal V3 Rental Price Prediction ML Service",
        "benchmark": "Asheville, NC Inside Airbnb (1,800 Listings)",
        "model": "HistGradientBoostingRegressor (log1p)",
        "models_loaded": {
            "rental_price_model": predictor.model is not None,
            "conformal_predictor": True,
            "shap_attribution": True
        }
    }), 200

@app.route("/api/predict-rent", methods=["POST"])
def predict_rent_endpoint():
    try:
        # Check if multipart form data or json
        if request.content_type and "multipart/form-data" in request.content_type:
            data = request.form.to_dict()
            image_file = request.files.get("image")
        else:
            data = request.get_json() or {}
            image_file = None

        accommodates = float(data.get("accommodates", data.get("guests", 4)))
        bedrooms = float(data.get("bedrooms", data.get("bhk", 2)))
        beds = float(data.get("beds", bedrooms))
        bathrooms = float(data.get("bathrooms", data.get("bathroom", 1.5)))
        latitude = float(data.get("latitude", 35.5951))
        longitude = float(data.get("longitude", -82.5515))
        room_type = data.get("room_type", "Entire home/apt")
        property_type = data.get("property_type", "Entire home")
        is_superhost = int(data.get("is_superhost", 0))
        min_nights = float(data.get("min_nights", data.get("minimum_nights", 2)))
        avail_365 = float(data.get("avail_365", data.get("availability_365", 180)))
        num_reviews = float(data.get("num_reviews", data.get("number_of_reviews", 25)))
        rating = float(data.get("rating", 4.85))
        rating_cleanliness = float(data.get("rating_cleanliness", 4.90))
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
            avail_365=avail_365,
            num_reviews=num_reviews,
            rating=rating,
            rating_cleanliness=rating_cleanliness,
            description=description,
            image_file=image_file,
            **data
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
    print(f"Starting Multimodal V3 ML Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
