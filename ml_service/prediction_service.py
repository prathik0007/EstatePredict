import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from PIL import Image
from sentence_transformers import SentenceTransformer
import shap

# Resolve paths safely
BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
V5_DIR = DATASETS_DIR / "multimodal_v5"
V5_MODELS_DIR = V5_DIR / "models"
V5_FEATURES_DIR = V5_DIR / "features"

# Key Austin Metropolitan Landmarks (Latitude, Longitude) matching V5 research
LANDMARKS = {
    'dist_city_center_km': (30.2747, -97.7404),         # Texas State Capitol / Downtown Austin
    'dist_airport_km': (30.1975, -97.6664),             # Austin-Bergstrom International Airport (AUS)
    'dist_ut_austin_km': (30.2849, -97.7341),           # University of Texas at Austin Main Campus
    'dist_zilker_park_km': (30.2670, -97.7730),         # Zilker Park / Barton Springs / ACL Festival
    'dist_convention_center_km': (30.2635, -97.7397),   # Austin Convention Center / SXSW Hub
    'dist_the_domain_km': (30.4014, -97.7247),          # The Domain (North Austin Tech / Shopping Hub)
    'dist_cota_km': (30.1346, -97.6411),                # Circuit of the Americas (F1 / Concert Venue)
    'dist_south_congress_km': (30.2505, -97.7497)       # South Congress (SoCo Cultural / Dining Corridor)
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Haversine distance in kilometers between coordinates.
    Matches 07_phase7_geographic_features.py exactly.
    """
    R = 6371.0088  # Earth mean radius in km
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (np.sin(dlat / 2.0) ** 2 +
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0) ** 2)
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))


class MultimodalV5Predictor:
    """
    V5 Multimodal Rental Price Predictor for Austin, TX.
    
    Architecture:
    - Tabular: 71 standardized and one-hot features via tabular_preprocessor.joblib
    - Geographic: 20 spatial & landmark distance features via geo_scaler.joblib
    - Text: 384-dimensional normalized embeddings from BAAI/bge-small-en-v1.5
    - Image: 512-dimensional normalized embeddings from sentence-transformers/clip-ViT-B-32
    - Multimodal Concat Model: LightGBM regressor on exact 987 features (lgb_multimodal_concat.joblib)
    - Tabular+Geo Fallback Model: LightGBM regressor on 91 features (lgb_tab_geo.joblib) when image or text is absent
    - Conformal Calibration: Split conformal prediction with q=0.8435 (nominal 95%, empirical 96.63%)
    """
    def __init__(self):
        print("Initializing Multimodal V5 Rental Predictor (Austin, TX benchmark)...")
        self.random_seed = 42
        self.q_conformal = 0.8435  # V5 finite-sample conformal quantile at nominal 95% coverage (96.63% empirical)

        self.num_cols = [
            'accommodates_num', 'bathrooms_num', 'bedrooms_num', 'beds_num',
            'minimum_nights_num', 'maximum_nights_num', 'availability_365_num',
            'number_of_reviews_num', 'review_scores_rating_num', 'review_scores_cleanliness_num',
            'review_scores_location_num', 'host_is_superhost_num', 'host_identity_verified_num',
            'instant_bookable_num'
        ]
        self.cat_cols = ['room_type_cat', 'property_type_cat']

        self.tabular_preprocessor = None
        self.geo_scaler = None
        self.lgb_multimodal_concat = None
        self.lgb_tab_geo = None
        self.text_model = None
        self.image_model = None
        self.explainer = None
        self.interpretable_feature_names = []

        self._load_models_and_encoders()

    def _load_models_and_encoders(self):
        tab_path = V5_MODELS_DIR / "tabular_preprocessor.joblib"
        geo_path = V5_MODELS_DIR / "geo_scaler.joblib"
        lgb_full_path = V5_MODELS_DIR / "lgb_multimodal_concat.joblib"
        lgb_geo_path = V5_MODELS_DIR / "lgb_tab_geo.joblib"

        # 1. Tabular Preprocessor
        if tab_path.exists():
            self.tabular_preprocessor = joblib.load(tab_path)
            print("Loaded V5 tabular preprocessor (71 features).")
        else:
            print(f"Warning: Tabular preprocessor not found at {tab_path}")

        # 2. Geo Scaler
        if geo_path.exists():
            self.geo_scaler = joblib.load(geo_path)
            print("Loaded V5 geo scaler (20 features).")
        else:
            print(f"Warning: Geo scaler not found at {geo_path}")

        # 3. LightGBM Multimodal Concat Model (987 features)
        if lgb_full_path.exists():
            self.lgb_multimodal_concat = joblib.load(lgb_full_path)
            print("Loaded V5 LightGBM multimodal concatenation model (987 features).")
        else:
            print(f"Warning: Multimodal concat model not found at {lgb_full_path}")

        # 4. LightGBM Tabular+Geo Fallback Model (91 features)
        if lgb_geo_path.exists():
            self.lgb_tab_geo = joblib.load(lgb_geo_path)
            print("Loaded V5 LightGBM tabular+geographic model (91 features).")
            try:
                self.explainer = shap.TreeExplainer(self.lgb_tab_geo)
                print("Initialized SHAP TreeExplainer on V5 Tabular+Geo model.")
            except Exception as ex:
                print(f"Note on SHAP initialization: {ex}")
        else:
            print(f"Warning: Tab+Geo model not found at {lgb_geo_path}")

        # Construct interpretable feature names for SHAP
        if self.tabular_preprocessor is not None:
            cat_encoder = self.tabular_preprocessor.named_transformers_['cat']
            cat_names = list(cat_encoder.get_feature_names_out(self.cat_cols))
            tab_names = self.num_cols + cat_names
        else:
            tab_names = self.num_cols + self.cat_cols

        geo_names = ['latitude', 'longitude', 'lat_rad', 'lon_rad']
        for lm in LANDMARKS.keys():
            geo_names.extend([lm, f'log_{lm}'])
        self.interpretable_feature_names = tab_names + geo_names

        # 5. Text Encoder (BAAI/bge-small-en-v1.5)
        try:
            print("Loading BAAI/bge-small-en-v1.5 text encoder...")
            self.text_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
            print("Loaded BAAI/bge-small-en-v1.5 text encoder (384d).")
        except Exception as e:
            print(f"Warning: Error loading text encoder: {e}")

        # 6. Image Encoder (sentence-transformers/clip-ViT-B-32)
        try:
            print("Loading sentence-transformers/clip-ViT-B-32 image encoder...")
            self.image_model = SentenceTransformer("sentence-transformers/clip-ViT-B-32")
            print("Loaded sentence-transformers/clip-ViT-B-32 image encoder (512d).")
        except Exception as e:
            print(f"Warning: Error loading image encoder: {e}")

    def extract_geo_features(self, lat, lon):
        """
        Computes 20 geographic distance & coordinate features matching V5 Phase 7.
        """
        lats = np.array([float(lat)])
        lons = np.array([float(lon)])
        geo_dict = {
            'latitude': lats,
            'longitude': lons,
            'lat_rad': np.radians(lats),
            'lon_rad': np.radians(lons)
        }
        for name, (l_lat, l_lon) in LANDMARKS.items():
            dist = haversine_distance(lats, lons, l_lat, l_lon)
            geo_dict[name] = dist
            geo_dict[f'log_{name}'] = np.log1p(dist)

        geo_df = pd.DataFrame(geo_dict)
        if self.geo_scaler is not None:
            return self.geo_scaler.transform(geo_df)
        return np.zeros((1, 20))

    def extract_text_embedding(self, text):
        """
        Extracts 384-dimensional normalized text embedding using BAAI/bge-small-en-v1.5.
        """
        if not text or not text.strip():
            return None
        if self.text_model is None:
            return None
        clean_text = text.strip()[:512]
        emb = self.text_model.encode([clean_text], normalize_embeddings=True)
        return np.asarray(emb, dtype=np.float32)

    def extract_image_embedding(self, image_file):
        """
        Extracts 512-dimensional normalized image embedding using sentence-transformers/clip-ViT-B-32.
        Pre-resizes PIL image to 224x224 matching V5 Phase 3.
        """
        if image_file is None:
            return None
        if self.image_model is None:
            return None
        try:
            if hasattr(image_file, "seek"):
                image_file.seek(0)
            img = Image.open(image_file).convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
            emb = self.image_model.encode([img], normalize_embeddings=True)
            return np.asarray(emb, dtype=np.float32)
        except Exception as e:
            print(f"Note on image embedding extraction: {e}")
            return None

    def predict(
        self,
        accommodates=4,
        bathrooms=1.5,
        bedrooms=2,
        beds=2,
        latitude=30.2747,
        longitude=-97.7404,
        room_type="Entire home/apt",
        property_type="Entire home",
        is_superhost=0,
        min_nights=2,
        max_nights=1125,
        avail_365=180,
        num_reviews=25,
        rating=4.85,
        rating_cleanliness=4.90,
        rating_location=4.85,
        identity_verified=1,
        instant_bookable=0,
        description="",
        image_file=None,
        **kwargs
    ):
        # Fallback aliases from legacy forms
        if 'bhk' in kwargs:
            bedrooms = float(kwargs['bhk'])
        if 'size' in kwargs:
            accommodates = max(1.0, float(kwargs['size']) / 250.0)
        if 'bathroom' in kwargs:
            bathrooms = float(kwargs['bathroom'])

        # 1. Tabular features (71-dimensional output via ColumnTransformer)
        tab_row = {
            'accommodates_num': float(accommodates),
            'bathrooms_num': float(bathrooms),
            'bedrooms_num': float(bedrooms),
            'beds_num': float(beds if beds else bedrooms),
            'minimum_nights_num': float(min_nights),
            'maximum_nights_num': float(max_nights if max_nights else 1125),
            'availability_365_num': float(avail_365),
            'number_of_reviews_num': float(num_reviews),
            'review_scores_rating_num': float(rating),
            'review_scores_cleanliness_num': float(rating_cleanliness),
            'review_scores_location_num': float(rating_location),
            'host_is_superhost_num': 1 if str(is_superhost).lower() in ['1', 'true', 't', 'yes'] else 0,
            'host_identity_verified_num': 1 if str(identity_verified).lower() in ['1', 'true', 't', 'yes'] else 0,
            'instant_bookable_num': 1 if str(instant_bookable).lower() in ['1', 'true', 't', 'yes'] else 0,
            'room_type_cat': room_type if room_type in ['Entire home/apt', 'Private room', 'Shared room', 'Hotel room'] else 'Entire home/apt',
            'property_type_cat': property_type if property_type else 'Entire home'
        }
        tab_df = pd.DataFrame([tab_row])

        if self.tabular_preprocessor is not None:
            X_tab = self.tabular_preprocessor.transform(tab_df)
        else:
            X_tab = np.zeros((1, 71))

        # 2. Geographic features (20-dimensional output)
        X_geo = self.extract_geo_features(latitude, longitude)
        X_tab_geo = np.hstack([X_tab, X_geo])  # Shape (1, 91)

        # 3. Text & Image Embeddings
        has_description = bool(description and description.strip())
        text_emb = self.extract_text_embedding(description) if has_description else None

        has_image = image_file is not None
        img_emb = self.extract_image_embedding(image_file) if has_image else None

        # 4. Pipeline Routing: Full Multimodal vs Fallback
        use_full_multimodal = (
            text_emb is not None and
            img_emb is not None and
            self.lgb_multimodal_concat is not None
        )

        if use_full_multimodal:
            # Construct exact 987-feature vector: 71 tab + 20 geo + 384 text + 512 img
            X_full = np.hstack([X_tab, X_geo, text_emb, img_emb])
            pred_log = float(self.lgb_multimodal_concat.predict(X_full)[0])
            active_pipeline = "V5 LightGBM Multimodal Concatenation (987 features: Tabular + Geo + BGE-small + CLIP ViT-B/32)"
            model_name = "LightGBM Multimodal Concatenation (V5)"
        elif self.lgb_tab_geo is not None:
            # Clean 91-feature Tabular + Geographic Fallback
            pred_log = float(self.lgb_tab_geo.predict(X_tab_geo)[0])
            active_pipeline = "V5 Tabular + Geographic Fallback (91 features: 71 Tabular + 20 Austin Landmark Distances)"
            model_name = "LightGBM Tabular+Geographic (V5 Fallback)"
        else:
            # Ultra-safe baseline fallback
            pred_log = np.log1p(185.0)
            active_pipeline = "Baseline Fallback ($185 Austin median)"
            model_name = "Baseline Fallback"

        # 5. Invert log1p scale to original USD
        predicted_price_usd = float(np.expm1(pred_log))

        # 6. V5 Split Conformal Prediction Intervals (nominal 95%, q=0.8435, empirical 96.63%)
        lower_bound_log = pred_log - self.q_conformal
        upper_bound_log = pred_log + self.q_conformal

        lower_bound_usd = float(np.maximum(10.0, np.expm1(lower_bound_log)))
        upper_bound_usd = float(np.expm1(upper_bound_log))

        # 7. SHAP Feature Attribution on Tabular+Geo Model (instant TreeExplainer)
        shap_dict = {}
        if self.explainer is not None:
            try:
                shap_res = self.explainer(X_tab_geo)
                shap_vals = shap_res.values[0]
                shap_dict = dict(zip(self.interpretable_feature_names, shap_vals))
            except Exception as e:
                print(f"SHAP explanation note: {e}")

        def format_shap(v):
            r = round(float(v), 2)
            return 0.0 if abs(r) == 0.0 else r

        accommodates_shap = float(shap_dict.get('accommodates_num', 0.0))
        bathrooms_shap = float(shap_dict.get('bathrooms_num', 0.0))
        bedrooms_shap = float(shap_dict.get('bedrooms_num', 0.0))
        city_center_shap = float(shap_dict.get('dist_city_center_km', 0.0)) + float(shap_dict.get('log_dist_city_center_km', 0.0))
        airport_shap = float(shap_dict.get('dist_airport_km', 0.0)) + float(shap_dict.get('log_dist_airport_km', 0.0))
        soco_shap = float(shap_dict.get('dist_south_congress_km', 0.0)) + float(shap_dict.get('log_dist_south_congress_km', 0.0))
        zilker_shap = float(shap_dict.get('dist_zilker_park_km', 0.0)) + float(shap_dict.get('log_dist_zilker_park_km', 0.0))
        domain_shap = float(shap_dict.get('dist_the_domain_km', 0.0)) + float(shap_dict.get('log_dist_the_domain_km', 0.0))
        rating_shap = float(shap_dict.get('review_scores_rating_num', 0.0))
        min_nights_shap = float(shap_dict.get('minimum_nights_num', 0.0))

        top_factors = [
            {"feature": "Accommodates (Guests)", "impact": format_shap(accommodates_shap)},
            {"feature": "Bathrooms", "impact": format_shap(bathrooms_shap)},
            {"feature": "Downtown Austin Proximity", "impact": format_shap(city_center_shap)},
            {"feature": "Bedrooms", "impact": format_shap(bedrooms_shap)},
            {"feature": "South Congress Corridor", "impact": format_shap(soco_shap)},
            {"feature": "Zilker Park / Barton Springs", "impact": format_shap(zilker_shap)},
            {"feature": "Minimum Nights", "impact": format_shap(min_nights_shap)},
            {"feature": "Review Rating", "impact": format_shap(rating_shap)}
        ]
        top_factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

        usd_to_inr_rate = float(os.environ.get("USD_TO_INR_RATE", 83.50))
        predicted_price_inr = int(round(predicted_price_usd * usd_to_inr_rate))
        lower_bound_inr = int(round(lower_bound_usd * usd_to_inr_rate))
        upper_bound_inr = int(round(upper_bound_usd * usd_to_inr_rate))

        return {
            "predicted_rent": round(predicted_price_usd, 2),
            "predicted_price_usd": round(predicted_price_usd, 2),
            "lower_bound": round(lower_bound_usd, 2),
            "upper_bound": round(upper_bound_usd, 2),
            "predicted_price_inr": predicted_price_inr,
            "lower_bound_inr": lower_bound_inr,
            "upper_bound_inr": upper_bound_inr,
            "usd_to_inr_rate": usd_to_inr_rate,
            "unit": "USD/night",
            "model_name": model_name,
            "pipeline_used": active_pipeline,
            "modalities_used": {
                "tabular": True,
                "geographic": True,
                "text": text_emb is not None,
                "image": img_emb is not None
            },
            "benchmark_dataset": "Austin, TX Inside Airbnb (5,050 aligned multimodal listings)",
            "prediction_interval": {
                "nominal_coverage": "95%",
                "empirical_coverage": "96.63%",
                "quantile_q": self.q_conformal,
                "lower_bound_usd": round(lower_bound_usd, 2),
                "upper_bound_usd": round(upper_bound_usd, 2),
                "lower_bound_inr": lower_bound_inr,
                "upper_bound_inr": upper_bound_inr,
                "mean_interval_width_usd": 493.10,
                "median_interval_width_usd": 390.43
            },
            "top_factors": top_factors,
            "shap_values": {
                "Accommodates (Guests)": round(accommodates_shap, 4),
                "Bathrooms": round(bathrooms_shap, 4),
                "Bedrooms": round(bedrooms_shap, 4),
                "Downtown Austin Proximity": round(city_center_shap, 4),
                "South Congress Corridor": round(soco_shap, 4),
                "Zilker Park / Barton Springs": round(zilker_shap, 4),
                "The Domain Proximity": round(domain_shap, 4),
                "Airport Proximity": round(airport_shap, 4),
                "Minimum Nights": round(min_nights_shap, 4),
                "Review Rating": round(rating_shap, 4),
                "Number of Reviews": round(float(shap_dict.get('number_of_reviews_num', 0.0)), 4),
                "Cleanliness Rating": round(float(shap_dict.get('review_scores_cleanliness_num', 0.0)), 4),
                "Availability (365d)": round(float(shap_dict.get('availability_365_num', 0.0)), 4)
            },
            "image_used": img_emb is not None,
            "description_used": text_emb is not None,
            "research_benchmark": {
                "benchmark_name": "V5 Multimodal Research Benchmark",
                "cohort_size": "5,050 aligned Austin, TX listings",
                "architecture": "LightGBM multimodal concatenation",
                "visual_encoder": "CLIP ViT-B/32 visual representation (512d)",
                "text_encoder": "BGE-small text representation (384d)",
                "geographic_features": "20 geographic distance features (8 Austin landmarks + coordinates)",
                "conformal_calibration": "95% nominal conformal prediction intervals (q=0.8435, 96.63% empirical coverage)",
                "metrics": {
                    "mae_usd": 77.74,
                    "rmse_usd": 159.11,
                    "r2": 0.6841,
                    "mape_pct": 27.73,
                    "medae_usd": 34.26
                },
                "attention_model_reference": {
                    "architecture": "Multimodal Cross-Attention Fusion (PyTorch)",
                    "r2": 0.7114,
                    "rmse_usd": 152.095,
                    "note": "Ablation research model"
                }
            }
        }


# Singleton instance for the service
predictor = MultimodalV5Predictor()
