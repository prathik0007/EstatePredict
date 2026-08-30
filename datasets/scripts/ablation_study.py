import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

df = pd.read_csv("../training_dataset.csv")
tabular = []
text = []
image = []

for col in df.columns:

    if col == "Rent":
        continue

    if col.startswith("Embedding"):
        text.append(col)

    elif col.startswith("Image_Fe"):
        image.append(col)

    else:
        tabular.append(col)

print("Tabular:", len(tabular))
print("Text:", len(text))
print("Image:", len(image))

print(tabular)

# Target
y = df["Rent"]

# Features
X = df.drop(columns=["Rent"])

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error

experiments = {
    "Tabular Only": tabular,
    "Tabular + Text": tabular + text,
    "Tabular + Image": tabular + image,
    "Full Multimodal": tabular + text + image
}

print("\nAblation Study Results\n")

for exp_name, features in experiments.items():

    X = df[features]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    model = RandomForestRegressor(random_state=42)

    model.fit(X_train, y_train)

    pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, pred)
    rmse = mean_squared_error(y_test, pred) ** 0.5
    r2 = r2_score(y_test, pred)
    mape = mean_absolute_percentage_error(y_test, pred) * 100

    print("=" * 60)
    print(exp_name)
    print(f"Number of Features : {len(features)}")
    print(f"MAE  : {mae:.2f}")
    print(f"RMSE : {rmse:.2f}")
    print(f"R²   : {r2:.4f}")
    print(f"MAPE : {mape:.2f}%")