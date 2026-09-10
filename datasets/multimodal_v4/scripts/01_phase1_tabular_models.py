import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error
from xgboost import XGBRegressor
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_COHORT = os.path.join(V4_DIR, "processed", "v4_cohort.csv")
RESULTS_DIR = os.path.join(V4_DIR, "results")
OUT_CSV = os.path.join(RESULTS_DIR, "model_comparison.csv")

os.makedirs(RESULTS_DIR, exist_ok=True)

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

def run_phase1_tabular_comparison(random_seed=42):
    print("=" * 70)
    print("PHASE 1: STRONGER TABULAR REGRESSOR BASELINES")
    print("=" * 70)
    
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    print(f"Total cohort size: {N}")
    
    num_cols = [
        'latitude_numeric', 'longitude_numeric', 'accommodates_numeric',
        'bathrooms_numeric', 'beds_numeric', 'num_reviews', 'rating',
        'rating_cleanliness', 'min_nights', 'avail_365'
    ]
    cat_cols = ['room_type_clean', 'property_type_grouped', 'is_superhost']
    
    y = df['price_usd'].values
    
    # 80/20 train/test split identical to V3
    indices = np.arange(N)
    train_idx, test_idx = train_test_split(indices, test_size=0.20, random_state=random_seed)
    
    print(f"Train size: {len(train_idx)}, Test size: {len(test_idx)}")
    
    # Fit preprocessing strictly on training data
    num_imputer = SimpleImputer(strategy='median')
    num_scaler = RobustScaler()
    X_num_tr = num_scaler.fit_transform(num_imputer.fit_transform(df.iloc[train_idx][num_cols]))
    X_num_te = num_scaler.transform(num_imputer.transform(df.iloc[test_idx][num_cols]))
    
    cat_ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat_tr = cat_ohe.fit_transform(df.iloc[train_idx][cat_cols])
    X_cat_te = cat_ohe.transform(df.iloc[test_idx][cat_cols])
    
    X_tr = np.hstack([X_num_tr, X_cat_tr])
    X_te = np.hstack([X_num_te, X_cat_te])
    
    print(f"Feature matrix dimension: {X_tr.shape[1]}")
    
    y_tr = y[train_idx]
    y_te = y[test_idx]
    
    models = {
        "HistGradientBoosting (V3 Baseline)": HistGradientBoostingRegressor(
            max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
        ),
        "XGBoost": XGBRegressor(
            n_estimators=150, max_depth=5, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8,
            random_state=random_seed, n_jobs=-1
        ),
        "CatBoost": CatBoostRegressor(
            iterations=250, depth=6, learning_rate=0.05, random_seed=random_seed, verbose=0
        ),
        "LightGBM": LGBMRegressor(
            n_estimators=150, max_depth=5, learning_rate=0.05, num_leaves=31,
            random_state=random_seed, verbose=-1, n_jobs=-1
        )
    }
    
    results = []
    
    for name, base_reg in models.items():
        print(f"\nEvaluating: {name}...")
        ttr = TransformedTargetRegressor(regressor=base_reg, func=np.log1p, inverse_func=np.expm1)
        ttr.fit(X_tr, y_tr)
        y_pred = ttr.predict(X_te)
        
        mae = mean_absolute_error(y_te, y_pred)
        rmse = np.sqrt(mean_squared_error(y_te, y_pred))
        r2 = r2_score(y_te, y_pred)
        mape = compute_mape(y_te, y_pred)
        medae = median_absolute_error(y_te, y_pred)
        
        print(f"  MAE   : ${mae:.2f}")
        print(f"  RMSE  : ${rmse:.2f}")
        print(f"  R2    : {r2:.4f}")
        print(f"  MAPE  : {mape:.2f}%")
        print(f"  MedAE : ${medae:.2f}")
        
        results.append({
            "Model": name,
            "Target_Transform": "log1p",
            "Feature_Dim": X_tr.shape[1],
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2),
            "MedAE": round(medae, 2),
            "Test_N": len(test_idx)
        })
        
    res_df = pd.DataFrame(results)
    res_df.to_csv(OUT_CSV, index=False)
    print(f"\nResults successfully saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    run_phase1_tabular_comparison()
