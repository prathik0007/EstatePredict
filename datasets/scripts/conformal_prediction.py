import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

from mapie.regression import SplitConformalRegressor

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

# -------------------------
# Train Random Forest first
# -------------------------

rf = RandomForestRegressor(random_state=42)

rf.fit(X_train, y_train)

# -------------------------
# MAPIE Conformal
# -------------------------

model = SplitConformalRegressor(
    estimator=rf,
    confidence_level=0.95,
    prefit=True
)

# Calibrate using the training data
model.conformalize(X_train, y_train)

# Predict
prediction, intervals = model.predict_interval(X_test)
print("Prediction shape:", prediction.shape)
print("Intervals shape :", intervals.shape)

# Display first 10 predictions
for i in range(10):

    print("=" * 60)

    print(f"Actual Rent     : {y_test.iloc[i]}")
    print(f"Predicted Rent  : {prediction[i]:.2f}")
    print(f"Lower Bound     : {intervals[i,0,0]:.2f}")
    print(f"Upper Bound     : {intervals[i,1,0]:.2f}")