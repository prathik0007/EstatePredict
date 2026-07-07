import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

from mapie.regression import SplitConformalRegressor

# Load dataset
df = pd.read_csv("../training_dataset.csv")

# Features and Target
X = df.drop(columns=["Rent"])
y = df["Rent"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Random Forest
rf = RandomForestRegressor(random_state=42)

rf.fit(X_train, y_train)

# Create Conformal Model
conformal_model = SplitConformalRegressor(
    estimator=rf,
    confidence_level=0.95,
    prefit=True
)

# Calibrate
conformal_model.conformalize(X_train, y_train)

# Save
joblib.dump(
    conformal_model,
    "../models/conformal_model.pkl"
)

print("Conformal model saved successfully!")