import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

# Load dataset
df = pd.read_csv("training_dataset.csv")

# Target
y = df["Rent"]

# Features
X = df.drop(columns=["Rent"])

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Random Forest
model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, "rental_price_model.pkl")

print("Model saved successfully!")