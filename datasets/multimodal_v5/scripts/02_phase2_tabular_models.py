"""
Phase 2: Tabular Baselines Comparison
Workspace: datasets/multimodal_v5/
Models: HistGradientBoosting, XGBoost, CatBoost, LightGBM
Strictly identical preprocessing, target (log1p price), train/test split.
Evaluation metrics in original USD ($): MAE, RMSE, R2, MAPE, MedAE.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from xgboost import XGBRegressor
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"
FEATURES_DIR = "datasets/multimodal_v5/features"

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(FEATURES_DIR, exist_ok=True)

print("=== Phase 2: Tabular Baseline Models Comparison ===")

# Load cohort and splits
df = pd.read_csv(PROCESSED_CSV)
train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

train_df = df[df['id'].isin(train_ids)].copy().sort_values('id').reset_index(drop=True)
test_df = df[df['id'].isin(test_ids)].copy().sort_values('id').reset_index(drop=True)

print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")

# Define feature sets
num_cols = [
    'accommodates_num', 'bathrooms_num', 'bedrooms_num', 'beds_num',
    'minimum_nights_num', 'maximum_nights_num', 'availability_365_num',
    'number_of_reviews_num', 'review_scores_rating_num', 'review_scores_cleanliness_num',
    'review_scores_location_num', 'host_is_superhost_num', 'host_identity_verified_num',
    'instant_bookable_num'
]
cat_cols = ['room_type_cat', 'property_type_cat']

# Preprocessor fitted ONLY on train_df
preprocessor = ColumnTransformer(
    transformers=[
        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ]), num_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
    ]
)

print("Fitting tabular preprocessor strictly on train set...")
X_train = preprocessor.fit_transform(train_df)
X_test = preprocessor.transform(test_df)

feature_names = (
    num_cols +
    list(preprocessor.named_transformers_['cat'].get_feature_names_out(cat_cols))
)
print(f"Total tabular features: {X_train.shape[1]}")

y_train_log = train_df['log_price'].values
y_test_log = test_df['log_price'].values
y_test_usd = test_df['target_price'].values

# Save preprocessed matrices for downstream multimodal tasks
np.save(os.path.join(FEATURES_DIR, "tabular_X_train.npy"), X_train)
np.save(os.path.join(FEATURES_DIR, "tabular_X_test.npy"), X_test)
joblib.dump(preprocessor, os.path.join(MODELS_DIR, "tabular_preprocessor.joblib"))

# Define metric evaluator
def evaluate_metrics(y_true_usd, y_pred_usd):
    # Clip negative predictions to minimum valid price
    y_pred_usd = np.clip(y_pred_usd, 1.0, None)
    mae = mean_absolute_error(y_true_usd, y_pred_usd)
    rmse = np.sqrt(mean_squared_error(y_true_usd, y_pred_usd))
    r2 = r2_score(y_true_usd, y_pred_usd)
    mape = np.mean(np.abs((y_true_usd - y_pred_usd) / y_true_usd)) * 100.0
    medae = median_absolute_error(y_true_usd, y_pred_usd)
    return {
        'MAE': round(float(mae), 3),
        'RMSE': round(float(rmse), 3),
        'R2': round(float(r2), 4),
        'MAPE': round(float(mape), 3),
        'MedAE': round(float(medae), 3)
    }

models = {
    'HistGradientBoosting': HistGradientBoostingRegressor(
        max_iter=300, max_leaf_nodes=31, learning_rate=0.05, random_state=42
    ),
    'LightGBM': LGBMRegressor(
        n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1
    ),
    'CatBoost': CatBoostRegressor(
        iterations=300, depth=6, learning_rate=0.05, random_seed=42, verbose=0
    ),
    'XGBoost': XGBRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0
    )
}

results = []

for name, model in models.items():
    print(f"Training {name}...")
    model.fit(X_train, y_train_log)
    
    # Predict in log scale, invert via expm1
    pred_log = model.predict(X_test)
    pred_usd = np.expm1(pred_log)
    
    metrics = evaluate_metrics(y_test_usd, pred_usd)
    print(f"  {name} Results: MAE=${metrics['MAE']}, RMSE=${metrics['RMSE']}, R2={metrics['R2']}, MAPE={metrics['MAPE']}%, MedAE=${metrics['MedAE']}")
    
    # Save model
    joblib.dump(model, os.path.join(MODELS_DIR, f"tabular_{name.lower()}.joblib"))
    
    row = {'Model': name}
    row.update(metrics)
    results.append(row)

res_df = pd.DataFrame(results).sort_values(by='MAE').reset_index(drop=True)
csv_out = os.path.join(RESULTS_DIR, "tabular_model_comparison.csv")
res_df.to_csv(csv_out, index=False)
print(f"\nTabular comparison saved to {csv_out}:\n{res_df}")
print("=== Phase 2 Complete! ===")
