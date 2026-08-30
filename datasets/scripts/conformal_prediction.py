import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

from mapie.regression import SplitConformalRegressor

# Load dataset
df = pd.read_csv("../training_dataset.csv")

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
# -------------------------
# Evaluation
# -------------------------

lower = intervals[:, 0, 0]
upper = intervals[:, 1, 0]
# -------------------------------------
# Stratified Uncertainty by Price Band
# -------------------------------------

results = pd.DataFrame({
    "Actual_Rent": y_test.values,
    "Lower": lower,
    "Upper": upper
})

results["Interval_Width"] = results["Upper"] - results["Lower"]

# Create Price Bands
results["Price_Band"] = pd.cut(
    results["Actual_Rent"],
    bins=[0, 10000, 20000, float("inf")],
    labels=["Low (<10k)", "Medium (10k-20k)", "High (>20k)"]
)

print("\n" + "=" * 70)
print("Coverage by Price Band")
print("=" * 70)

for band in results["Price_Band"].cat.categories:

    subset = results[results["Price_Band"] == band]

    if len(subset) == 0:
        continue

    coverage = (
        (
            (subset["Actual_Rent"] >= subset["Lower"]) &
            (subset["Actual_Rent"] <= subset["Upper"])
        ).mean()
    ) * 100

    avg_width = subset["Interval_Width"].mean()

    print(f"{band}")
    print(f"Coverage       : {coverage:.2f}%")
    print(f"Avg Width      : {avg_width:.2f}")
    print("-" * 50)

# Empirical Coverage
coverage = ((y_test >= lower) & (y_test <= upper)).mean() * 100

# Average Interval Width
avg_width = (upper - lower).mean()

print("\n" + "=" * 60)
print("Conformal Prediction Evaluation")
print("=" * 60)
print(f"Confidence Level        : 95%")
print(f"Empirical Coverage      : {coverage:.2f}%")
print(f"Average Interval Width  : {avg_width:.2f}")

# Display first 10 predictions
print("\nSample Predictions\n")

for i in range(min(10, len(prediction))):

    print("=" * 60)
    print(f"Actual Rent    : {y_test.iloc[i]}")
    print(f"Predicted Rent : {prediction[i]:.2f}")
    print(f"Lower Bound    : {lower[i]:.2f}")
    print(f"Upper Bound    : {upper[i]:.2f}")