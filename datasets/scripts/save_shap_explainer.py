import joblib
import pandas as pd
import shap

# Load dataset
df = pd.read_csv("../training_dataset.csv")

# Features
X = df.drop(columns=["Rent"])

# Load saved Random Forest model
model = joblib.load("../models/rental_price_model.pkl")

# Create SHAP explainer
explainer = shap.TreeExplainer(model)

# Save SHAP explainer
joblib.dump(
    explainer,
    "../models/shap_explainer.pkl"
)

print("SHAP explainer updated successfully!")