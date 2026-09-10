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
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor
from xgboost import XGBRegressor

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_COHORT = os.path.join(V4_DIR, "processed", "v4_cohort.csv")
FEATURES_DIR = os.path.join(V4_DIR, "features")
RESULTS_DIR = os.path.join(V4_DIR, "results")
GEO_CSV = os.path.join(FEATURES_DIR, "geographic_features.csv")
OUT_CSV = os.path.join(RESULTS_DIR, "geographic_feature_comparison.csv")

os.makedirs(FEATURES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Fixed geographic reference landmarks in Asheville, NC (WGS84 lat, lon)
LANDMARKS = {
    "city_center": (35.5951, -82.5515),       # Pack Square / Downtown Asheville
    "airport": (35.4361, -82.5418),           # Asheville Regional Airport (AVL)
    "biltmore": (35.5406, -82.5524),          # Biltmore Estate
    "blue_ridge_pkwy": (35.5779, -82.4764),   # Blue Ridge Parkway Visitor Center
    "river_arts": (35.5847, -82.5658)         # River Arts District
}

def haversine_np(lat1, lon1, lat2, lon2):
    """
    Calculate great-circle distance between coordinates in kilometers.
    """
    R = 6371.0 # Earth's mean radius in km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    
    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    return R * c

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

def engineer_geographic_features(df):
    lats = df['latitude_numeric'].values
    lons = df['longitude_numeric'].values
    
    geo_df = pd.DataFrame({'id': df['id']})
    
    # Compute Haversine distances to each landmark
    for name, (l_lat, l_lon) in LANDMARKS.items():
        geo_df[f'dist_{name}_km'] = haversine_np(lats, lons, l_lat, l_lon)
        
    # Minimum distance to any major tourist attraction
    attraction_cols = ['dist_biltmore_km', 'dist_blue_ridge_pkwy_km', 'dist_river_arts_km']
    geo_df['min_dist_attraction_km'] = geo_df[attraction_cols].min(axis=1)
    
    # Proximity interaction (inverse distance, avoiding division by zero)
    geo_df['inv_dist_city_center'] = 1.0 / (geo_df['dist_city_center_km'] + 0.1)
    
    return geo_df

def run_phase6_geographic_experiments(random_seed=42):
    print("=" * 70)
    print("PHASE 6: GEOGRAPHIC FEATURES ENGINEERING & BENCHMARK")
    print("=" * 70)
    
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    # 1. Compute Geographic Features
    geo_df = engineer_geographic_features(df)
    geo_df.to_csv(GEO_CSV, index=False)
    print(f"Computed {len(geo_df.columns)-1} geographic features and saved to {GEO_CSV}")
    
    geo_num_cols = [c for c in geo_df.columns if c != 'id']
    print(f"Geographic features: {geo_num_cols}")
    
    # 2. Standard Tabular Features
    num_cols = [
        'latitude_numeric', 'longitude_numeric', 'accommodates_numeric',
        'bathrooms_numeric', 'beds_numeric', 'num_reviews', 'rating',
        'rating_cleanliness', 'min_nights', 'avail_365'
    ]
    cat_cols = ['room_type_clean', 'property_type_grouped', 'is_superhost']
    y = df['price_usd'].values
    
    # 3. Train/Test Split (80/20, seed 42)
    indices = np.arange(N)
    train_idx, test_idx = train_test_split(indices, test_size=0.20, random_state=random_seed)
    
    # 4. Preprocess Tabular on Train Fold
    num_imputer = SimpleImputer(strategy='median')
    num_scaler = RobustScaler()
    X_num_tr = num_scaler.fit_transform(num_imputer.fit_transform(df.iloc[train_idx][num_cols]))
    X_num_te = num_scaler.transform(num_imputer.transform(df.iloc[test_idx][num_cols]))
    
    cat_ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat_tr = cat_ohe.fit_transform(df.iloc[train_idx][cat_cols])
    X_cat_te = cat_ohe.transform(df.iloc[test_idx][cat_cols])
    
    X_tab_tr = np.hstack([X_num_tr, X_cat_tr])
    X_tab_te = np.hstack([X_num_te, X_cat_te])
    
    # 5. Preprocess Geographic on Train Fold
    geo_scaler = RobustScaler()
    X_geo_tr = geo_scaler.fit_transform(geo_df.iloc[train_idx][geo_num_cols].values)
    X_geo_te = geo_scaler.transform(geo_df.iloc[test_idx][geo_num_cols].values)
    
    # Feature sets
    X_tab_geo_tr = np.hstack([X_tab_tr, X_geo_tr])
    X_tab_geo_te = np.hstack([X_tab_te, X_geo_te])
    
    y_tr = y[train_idx]
    y_te = y[test_idx]
    
    experiments = [
        ("HistGradientBoosting (V3 Baseline)", "Tabular Only (23-d)", X_tab_tr, X_tab_te,
         HistGradientBoostingRegressor(max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed)),
        ("HistGradientBoosting", "Tabular + Geographic (30-d)", X_tab_geo_tr, X_tab_geo_te,
         HistGradientBoostingRegressor(max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed)),
        ("LightGBM", "Tabular + Geographic (30-d)", X_tab_geo_tr, X_tab_geo_te,
         LGBMRegressor(n_estimators=150, max_depth=5, learning_rate=0.05, num_leaves=31, random_state=random_seed, verbose=-1, n_jobs=-1)),
        ("CatBoost", "Tabular + Geographic (30-d)", X_tab_geo_tr, X_tab_geo_te,
         CatBoostRegressor(iterations=250, depth=6, learning_rate=0.05, random_seed=random_seed, verbose=0)),
        ("XGBoost", "Tabular + Geographic (30-d)", X_tab_geo_tr, X_tab_geo_te,
         XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, random_state=random_seed, n_jobs=-1))
    ]
    
    results = []
    print("\n" + "=" * 70)
    print("EVALUATING GEOGRAPHIC FEATURES BENCHMARK (USD PRICE SCALE):")
    print("=" * 70)
    
    for model_name, feat_name, X_tr, X_te, reg in experiments:
        ttr = TransformedTargetRegressor(regressor=reg, func=np.log1p, inverse_func=np.expm1)
        ttr.fit(X_tr, y_tr)
        y_pred = ttr.predict(X_te)
        
        mae = mean_absolute_error(y_te, y_pred)
        rmse = np.sqrt(mean_squared_error(y_te, y_pred))
        r2 = r2_score(y_te, y_pred)
        mape = compute_mape(y_te, y_pred)
        medae = median_absolute_error(y_te, y_pred)
        
        print(f"\n[{model_name} | {feat_name}] ({X_tr.shape[1]} features):")
        print(f"  MAE   : ${mae:.2f}")
        print(f"  RMSE  : ${rmse:.2f}")
        print(f"  R2    : {r2:.4f}")
        print(f"  MAPE  : {mape:.2f}%")
        print(f"  MedAE : ${medae:.2f}")
        
        results.append({
            "Model": model_name,
            "Features": feat_name,
            "Feature_Dimension": X_tr.shape[1],
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2),
            "MedAE": round(medae, 2),
            "Test_N": len(test_idx)
        })
        
    res_df = pd.DataFrame(results)
    res_df.to_csv(OUT_CSV, index=False)
    print(f"\nGeographic comparison results saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    run_phase6_geographic_experiments()
