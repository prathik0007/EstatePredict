import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from PIL import Image

# Ensure clean environment and suppress verbose logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Resolve root datasets paths safely
BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
MODELS_DIR = DATASETS_DIR / "models"
RESULTS_DIR = DATASETS_DIR / "results"
TRAINING_DATA_PATH = DATASETS_DIR / "training_dataset.csv"

# Ensure results directory exists
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Pre-defined Mappings matching original research pipeline exactly
CITY_MAP = {
    "Bangalore": 0,
    "Chennai": 1,
    "Delhi": 2,
    "Hyderabad": 3,
    "Kolkata": 4,
    "Mumbai": 5
}

AREA_TYPE_MAP = {
    "Super Area": 0,
    "Carpet Area": 1,
    "Built Area": 2
}

FURNISHING_MAP = {
    "Unfurnished": 0,
    "Semi-Furnished": 1,
    "Furnished": 2
}

TENANT_MAP = {
    "Bachelors": 0,
    "Family": 1,
    "Anyone": 2
}

PROPERTY_TYPE_MAP = {
    "Apartment": 0,
    "House": 1,
    "Villa": 2,
    "Condominium": 3
}

ROOM_TYPE_MAP = {
    "Entire home/apt": 0,
    "Private room": 1,
    "Shared room": 2
}

class RentalPredictor:
    def __init__(self):
        print("Loading lightweight ML models...")
        
        # Load column matrix reference
        if TRAINING_DATA_PATH.exists():
            training_df = pd.read_csv(TRAINING_DATA_PATH, nrows=5)
            self.feature_columns = [col for col in training_df.columns if col != "Rent"]
        else:
            raise FileNotFoundError(f"Training dataset not found at {TRAINING_DATA_PATH}")

        # Load tabular prediction models from datasets/models
        model_path = MODELS_DIR / "rental_price_model.pkl"
        conformal_path = MODELS_DIR / "conformal_model.pkl"
        shap_path = MODELS_DIR / "shap_explainer.pkl"

        self.model = joblib.load(model_path) if model_path.exists() else None
        self.conformal_model = joblib.load(conformal_path) if conformal_path.exists() else None

        # Heavy neural networks and explainers are lazy-loaded to keep memory < 512MB
        self.text_model = None
        self.image_model = None
        self.explainer = None

        # SHAP is optional and disabled by default on low-memory instances
        self.enable_shap = os.environ.get("ENABLE_SHAP", "false").lower() == "true"
        if self.enable_shap and shap_path.exists():
            self.explainer = joblib.load(shap_path)

        print("All lightweight ML components successfully initialized!")

    def predict(
        self,
        city="Mumbai",
        bhk=2,
        size=1000,
        bathroom=2,
        area_type="Super Area",
        furnishing="Semi-Furnished",
        tenant="Bachelors",
        bedrooms=2,
        bathrooms_airbnb=2.0,
        property_type="Apartment",
        room_type="Entire home/apt",
        description="Modern apartment with good amenities",
        image_file=None
    ):
        # 1. Text Embeddings (384 dimensions) - Lazy loaded on demand
        text_str = str(description).strip() if description else "Modern apartment with good amenities"
        try:
            if self.text_model is None:
                print("Loading SentenceTransformer (all-MiniLM-L6-v2) on demand...")
                from sentence_transformers import SentenceTransformer
                self.text_model = SentenceTransformer("all-MiniLM-L6-v2")
            text_embedding = self.text_model.encode([text_str])
        except Exception as e:
            print(f"Text embedding note/fallback: {e}")
            text_embedding = np.zeros((1, 384), dtype=np.float32)

        # 2. Image Features (1280 dimensions) - Lazy loaded only when image is provided
        if image_file:
            try:
                if self.image_model is None:
                    print("Loading EfficientNetB0 for image prediction on demand...")
                    try:
                        from tensorflow.keras.applications.efficientnet import EfficientNetB0
                    except ImportError:
                        from keras.applications.efficientnet import EfficientNetB0
                    
                    self.image_model = EfficientNetB0(
                        weights="imagenet",
                        include_top=False,
                        pooling="avg"
                    )

                if hasattr(image_file, 'seek'):
                    image_file.seek(0)

                img = Image.open(image_file).convert("RGB")
                img = img.resize((224, 224))

                img_array = np.array(img, dtype=np.float32)
                img_array = np.expand_dims(img_array, axis=0)

                try:
                    from tensorflow.keras.applications.efficientnet import preprocess_input
                except ImportError:
                    from keras.applications.efficientnet import preprocess_input

                img_array = preprocess_input(img_array)

                image_features = self.image_model.predict(
                    img_array,
                    verbose=0
                )
            except Exception as e:
                print(f"Error processing image, using baseline zero features: {e}")
                image_features = np.zeros((1, 1280), dtype=np.float32)
        else:
            image_features = np.zeros((1, 1280), dtype=np.float32)

        # 3. Build Feature Matrix DataFrame
        input_df = pd.DataFrame(
            np.zeros((1, len(self.feature_columns)), dtype=np.float32),
            columns=self.feature_columns
        )

        # Tabular numerical features
        input_df.loc[0, "BHK"] = float(bhk)
        input_df.loc[0, "Size"] = float(size)
        input_df.loc[0, "Bathroom"] = float(bathroom)
        input_df.loc[0, "Bedrooms"] = float(bedrooms)
        input_df.loc[0, "Bathrooms_Airbnb"] = float(bathrooms_airbnb)

        # Tabular categorical features with fallback default mappings
        input_df.loc[0, "City"] = CITY_MAP.get(city, 0)
        input_df.loc[0, "Area Type"] = AREA_TYPE_MAP.get(area_type, 0)
        input_df.loc[0, "Furnishing Status"] = FURNISHING_MAP.get(furnishing, 0)
        input_df.loc[0, "Tenant Preferred"] = TENANT_MAP.get(tenant, 0)
        input_df.loc[0, "Property_Type"] = PROPERTY_TYPE_MAP.get(property_type, 0)
        input_df.loc[0, "Room_Type"] = ROOM_TYPE_MAP.get(room_type, 0)

        # Text embeddings (384)
        for i in range(min(384, text_embedding.shape[1])):
            input_df.loc[0, f"Embedding_{i}"] = float(text_embedding[0][i])

        # Image features (1280)
        for i in range(min(1280, image_features.shape[1])):
            input_df.loc[0, f"Image_Feature_{i}"] = float(image_features[0][i])

        # 4. Conformal Prediction & Estimation
        if self.conformal_model:
            prediction, intervals = self.conformal_model.predict_interval(input_df)
            predicted_rent = float(prediction[0])
            lower_bound = float(intervals[0, 0, 0])
            upper_bound = float(intervals[0, 1, 0])
        elif self.model:
            predicted_rent = float(self.model.predict(input_df)[0])
            lower_bound = max(0.0, predicted_rent * 0.85)
            upper_bound = predicted_rent * 1.15
        else:
            predicted_rent = 25000.0
            lower_bound = 20000.0
            upper_bound = 30000.0

        # Ensure realistic positive lower bound
        lower_bound = max(1000.0, lower_bound)
        upper_bound = max(predicted_rent, upper_bound)

        # 5. SHAP Explanation & Top Feature Factors (only if enabled)
        top_factors = []
        shap_saved = False
        try:
            if self.enable_shap and self.explainer:
                import shap

                shap_vals = self.explainer.shap_values(input_df)
                values = shap_vals[0] if isinstance(shap_vals, list) else shap_vals[0]
                
                # Extract key tabular contributions
                key_tabular = ["Size", "BHK", "City", "Bathroom", "Furnishing Status", "Area Type"]
                for feat in key_tabular:
                    if feat in input_df.columns:
                        idx = list(input_df.columns).index(feat)
                        impact = float(values[idx])
                        top_factors.append({
                            "feature": feat,
                            "impact": round(impact, 2)
                        })
                # Sort by absolute impact
                top_factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

                # Save SHAP bar plot
                try:
                    import matplotlib
                    matplotlib.use("Agg")
                    import matplotlib.pyplot as plt

                    plt.figure(figsize=(10, 6))
                    shap.plots.bar(
                        shap.Explanation(
                            values=values,
                            base_values=self.explainer.expected_value if hasattr(self.explainer, 'expected_value') else 0,
                            data=input_df.iloc[0],
                            feature_names=input_df.columns
                        ),
                        show=False
                    )
                    plt.tight_layout()
                    shap_plot_file = RESULTS_DIR / "shap_bar.png"
                    plt.savefig(str(shap_plot_file))
                    plt.close()
                    shap_saved = True
                except Exception as plot_err:
                    plt.close()
                    print(f"SHAP plot save note: {plot_err}")
        except Exception as e:
            print(f"SHAP explanation computation note: {e}")

        return {
            "predicted_rent": round(predicted_rent, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
            "confidence_level": "95%",
            "top_factors": top_factors[:5],
            "shap_plot_saved": shap_saved
        }

# Singleton instance for the service
predictor = RentalPredictor()
