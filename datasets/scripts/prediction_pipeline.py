import joblib
import shap
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from PIL import Image

from sympy import intervals
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from sentence_transformers import SentenceTransformer

# Load trained model
model = joblib.load("../models/rental_price_model.pkl")

# Load conformal model
conformal_model = joblib.load("../models/conformal_model.pkl")
explainer = joblib.load("../models/shap_explainer.pkl")
# Load training dataset (only for column structure)
training_df = pd.read_csv("../training_dataset.csv")
city_map = {
    "Bangalore": 0,
    "Chennai": 1,
    "Delhi": 2,
    "Hyderabad": 3,
    "Kolkata": 4,
    "Mumbai": 5
}

area_type_map = {
    "Super Area": 0,
    "Carpet Area": 1,
    "Built Area": 2
}

furnishing_map = {
    "Unfurnished": 0,
    "Semi-Furnished": 1,
    "Furnished": 2
}

tenant_map = {
    "Bachelors": 0,
    "Family": 1,
    "Anyone": 2
}

property_type_map = {
    "Apartment": 0,
    "House": 1,
    "Villa": 2,
    "Condominium": 3
}

room_type_map = {
    "Entire home/apt": 0,
    "Private room": 1,
    "Shared room": 2
}

# Load MiniLM once
text_model = SentenceTransformer("all-MiniLM-L6-v2")
image_model = EfficientNetB0(
    weights="imagenet",
    include_top=False,
    pooling="avg"
)

def predict_rent(
    city,
    bhk,
    size,
    bathroom,
    area_type,
    furnishing,
    tenant,
    bedrooms,
    bathrooms_airbnb,
    property_type,
    room_type,
    description,
    uploaded_image
):

    # ------------------------
    # Text Features
    # ------------------------

    text_embedding = text_model.encode([description])
    print("Text embedding shape:", text_embedding.shape)

    # ------------------------
    # Image Features
    # ------------------------

    img = Image.open(uploaded_image)

    img = img.resize((224, 224))

    img_array = np.array(img)

    img_array = np.expand_dims(img_array, axis=0)

    img_array = preprocess_input(img_array)

    image_features = image_model.predict(
        img_array,
        verbose=0
    )

    # ------------------------
    # Create Input DataFrame
    # ------------------------

    feature_columns = training_df.columns.drop("Rent")

    input_df = pd.DataFrame(
    np.zeros((1, len(feature_columns)), dtype=np.float32),
    columns=feature_columns
    )
    # ------------------------
    # Fill Tabular Features
    # ------------------------

    input_df.loc[0, "BHK"] = bhk
    input_df.loc[0, "Size"] = size
    input_df.loc[0, "Bathroom"] = bathroom
    input_df.loc[0, "Bedrooms"] = bedrooms
    input_df.loc[0, "Bathrooms_Airbnb"] = bathrooms_airbnb

    # ------------------------
    # Fill Encoded Categorical Features
    # ------------------------

    input_df.loc[0, "City"] = city_map[city]
    input_df.loc[0, "Area Type"] = area_type_map[area_type]
    input_df.loc[0, "Furnishing Status"] = furnishing_map[furnishing]
    input_df.loc[0, "Tenant Preferred"] = tenant_map[tenant]
    input_df.loc[0, "Property_Type"] = property_type_map[property_type]
    input_df.loc[0, "Room_Type"] = room_type_map[room_type]

    # ------------------------
    # Fill Text Embeddings
    # ------------------------

    for i in range(384):
        input_df.loc[0, f"Embedding_{i}"] = text_embedding[0][i]
        
    # ------------------------
    # Fill Image Features
    # ------------------------

    for i in range(1280):
        input_df.loc[0, f"Image_Feature_{i}"] = image_features[0][i]

    # ------------------------
    # Temporary Test
    # ------------------------

    # ------------------------
    # Predict Rent
    # ------------------------

    # ------------------------
    # Predict Rent
    # ------------------------

    prediction, intervals = conformal_model.predict_interval(input_df)
    
    # ------------------------
    # SHAP Explanation
    # ------------------------

    shap_values = explainer.shap_values(input_df)
    plt.figure(figsize=(10, 6))

    shap.plots.bar(
    shap.Explanation(
        values=shap_values[0],
        base_values=explainer.expected_value,
        data=input_df.iloc[0],
        feature_names=input_df.columns
    ),
    show=False
)

    plt.tight_layout()

    plt.savefig("../results/shap_bar.png")

    plt.close()

    predicted_rent = prediction[0]

    lower_bound = intervals[0, 0, 0]
    upper_bound = intervals[0, 1, 0]

    return {
    "predicted_rent": predicted_rent,
    "lower_bound": lower_bound,
    "upper_bound": upper_bound
}