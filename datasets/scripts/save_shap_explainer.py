import joblib
import pandas as pd
import shap

from sklearn.ensemble import RandomForestRegressor

# Load dataset
df = pd.read_csv("../training_dataset.csv")

# Features
X = df.drop(columns=["Rent"])

# Target
y = df["Rent"]

# Train model
model = RandomForestRegressor(random_state=42)
model.fit(X, y)

# Create SHAP explainer
explainer = shap.TreeExplainer(model)

# Save explainer
joblib.dump(explainer, "../models/shap_explainer.pkl")

print("SHAP explainer saved successfully!")