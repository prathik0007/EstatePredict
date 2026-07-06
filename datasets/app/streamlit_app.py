
import streamlit as st
import sys
from pathlib import Path

# Allow importing from scripts/
sys.path.append(str(Path(__file__).resolve().parents[1] / "scripts"))

from prediction_pipeline import predict_rent

st.set_page_config(
    page_title="Rental Price Prediction",
    page_icon="🏠",
    layout="wide"
)

st.title("🏠 Explainable Multimodal Rental Price Prediction")
st.write("Predict rental price using images, text and tabular features.")

st.markdown("---")

# ==========================
# Property Details
# ==========================

st.header("🏡 Property Details")

col1, col2 = st.columns(2)

with col1:

    city = st.selectbox(
        "City",
        [
            "Bangalore",
            "Chennai",
            "Delhi",
            "Hyderabad",
            "Kolkata",
            "Mumbai"
        ]
    )

    bhk = st.number_input(
        "BHK",
        min_value=1,
        max_value=10,
        value=2
    )

    size = st.number_input(
        "Size (sq.ft)",
        min_value=100,
        max_value=10000,
        value=1000
    )

    area_type = st.selectbox(
        "Area Type",
        [
            "Super Area",
            "Carpet Area",
            "Built Area"
        ]
    )

    bedrooms = st.number_input(
        "Bedrooms",
        min_value=1,
        max_value=10,
        value=2
    )

with col2:

    bathroom = st.number_input(
        "Bathrooms",
        min_value=1,
        max_value=10,
        value=2
    )

    furnishing = st.selectbox(
        "Furnishing",
        [
            "Unfurnished",
            "Semi-Furnished",
            "Furnished"
        ]
    )

    tenant = st.selectbox(
        "Tenant Preferred",
        [
            "Bachelors",
            "Family",
            "Anyone"
        ]
    )

    bathrooms_airbnb = st.number_input(
        "Bathrooms (Airbnb)",
        min_value=1.0,
        max_value=10.0,
        value=2.0
    )

    property_type = st.selectbox(
        "Property Type",
        [
            "Apartment",
            "House",
            "Villa",
            "Condominium"
        ]
    )

    room_type = st.selectbox(
        "Room Type",
        [
            "Entire home/apt",
            "Private room",
            "Shared room"
        ]
    )
description = st.text_area(
    "Property Description",
    height=120
)

uploaded_image = st.file_uploader(
    "Upload Property Image",
    type=["jpg", "jpeg", "png"]
)

if uploaded_image is not None:
    st.image(uploaded_image, caption="Uploaded Property Image", use_container_width=True)

st.markdown("---")

predict = st.button("🔍 Predict Rent")

if predict:
    
    result = predict_rent(
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
    )

    st.success(result)