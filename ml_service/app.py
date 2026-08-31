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
        "service": "Rental Price Prediction ML Service",
        "models_loaded": {
            "rental_price_model": predictor.model is not None,
            "conformal_model": predictor.conformal_model is not None,
            "shap_explainer": predictor.explainer is not None,
            "text_embedding_model": False,
            "image_feature_model": predictor.image_model is not None
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

        city = data.get("city", "Mumbai")
        bhk = int(data.get("bhk", 2))
        size = float(data.get("size", 1000))
        bathroom = int(data.get("bathroom", 2))
        area_type = data.get("area_type", "Super Area")
        furnishing = data.get("furnishing", "Semi-Furnished")
        tenant = data.get("tenant", "Bachelors")
        bedrooms = float(data.get("bedrooms", bhk))
        bathrooms_airbnb = float(data.get("bathrooms_airbnb", bathroom))
        property_type = data.get("property_type", "Apartment")
        room_type = data.get("room_type", "Entire home/apt")
        description = data.get("description", "Modern property with high-quality amenities")

        result = predictor.predict(
            city=city,
            bhk=bhk,
            size=size,
            bathroom=bathroom,
            area_type=area_type,
            furnishing=furnishing,
            tenant=tenant,
            bedrooms=bedrooms,
            bathrooms_airbnb=bathrooms_airbnb,
            property_type=property_type,
            room_type=room_type,
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
    print(f"Starting ML Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
