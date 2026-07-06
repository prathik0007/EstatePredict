import joblib
import numpy as np
import pandas as pd
from PIL import Image

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from sentence_transformers import SentenceTransformer

# Load trained model
model = joblib.load("../models/rental_price_model.pkl")
# Load training dataset (only for column structure)
training_df = pd.read_csv("../training_dataset.csv")

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

    return (
    