"""
Phase 7: Geographic Feature Engineering & Comparison
Workspace: datasets/multimodal_v5/
Engineers target-independent spatial and distance features using Haversine formulation.
Compares Tabular Baseline vs. Tabular + Geographic Features.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error
from lightgbm import LGBMRegressor

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(FEATURES_DIR, exist_ok=True)

print("=== Phase 7: Target-Independent Geographic Feature Engineering ===")

# Haversine distance in kilometers
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0088  # Earth mean radius in km
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (np.sin(dlat / 2.0) ** 2 +
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0) ** 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return R * c

# Key Austin Metropolitan Landmarks (Latitude, Longitude)
LANDMARKS = {
    'dist_city_center_km': (30.2747, -97.7404),         # Texas State Capitol / Downtown Austin
    'dist_airport_km': (30.1975, -97.6664),             # Austin-Bergstrom International Airport (AUS)
    'dist_ut_austin_km': (30.2849, -97.7341),           # University of Texas at Austin Main Campus
    'dist_zilker_park_km': (30.2670, -97.7730),         # Zilker Park / Barton Springs / ACL Festival
    'dist_convention_center_km': (30.2635, -97.7397),   # Austin Convention Center / SXSW Hub
    'dist_the_domain_km': (30.4014, -97.7247),          # The Domain (North Austin Tech / Shopping Hub)
    'dist_cota_km': (30.1346, -97.6411),                # Circuit of the Americas (F1 / Concert Venue)
    'dist_south_congress_km': (30.2505, -97.7497)       # South Congress (SoCo Cultural / Dining Corridor)
}

def extract_geo_features(df):
    lats = df['latitude'].values
    lons = df['longitude'].values
    
    geo_dict = {
        'latitude': lats,
        'longitude': lons,
        'lat_rad': np.radians(lats),
        'lon_rad': np.radians(lons)
    }
    
    for name, (l_lat, l_lon) in LANDMARKS.items():
        geo_dict[name] = haversine_distance(lats, lons, l_lat, l_lon)
        # Log distance for non-linear decay
        geo_dict[f'log_{name}'] = np.log1p(geo_dict[name])
        
    return pd.DataFrame(geo_dict)

def run_phase7():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    geo_train = extract_geo_features(train_df)
    geo_test = extract_geo_features(test_df)
    geo_cols = list(geo_train.columns)
    print(f"Engineered {len(geo_cols)} target-independent geographic features: {geo_cols[:6]}...")

    # Scaler fitted ONLY on training set
    scaler = StandardScaler()
    geo_train_scaled = scaler.fit_transform(geo_train)
    geo_test_scaled = scaler.transform(geo_test)

    # Save geographic features
    np.save(os.path.join(FEATURES_DIR, "geo_train.npy"), geo_train_scaled)
    np.save(os.path.join(FEATURES_DIR, "geo_test.npy"), geo_test_scaled)
    joblib.dump(scaler, os.path.join(MODELS_DIR, "geo_scaler.joblib"))
    joblib.dump(geo_cols, os.path.join(FEATURES_DIR, "geo_feature_names.joblib"))

    # Load Tabular baselines
    tab_train = np.load(os.path.join(FEATURES_DIR, "tabular_X_train.npy"))
    tab_test = np.load(os.path.join(FEATURES_DIR, "tabular_X_test.npy"))

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    def eval_metrics(y_true, y_pred):
        y_pred = np.clip(y_pred, 1.0, None)
        return {
            'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
            'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
            'R2': round(float(r2_score(y_true, y_pred)), 4),
            'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
            'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
        }

    # Model 1: Tabular only (Best Tabular model: LightGBM)
    lgb_tab = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_tab.fit(tab_train, y_train_log)
    pred_tab = np.expm1(lgb_tab.predict(tab_test))
    m_tab = eval_metrics(y_test_usd, pred_tab)

    # Model 2: Tabular + Geographic features
    X_train_geo = np.hstack([tab_train, geo_train_scaled])
    X_test_geo = np.hstack([tab_test, geo_test_scaled])
    np.save(os.path.join(FEATURES_DIR, "tab_geo_train.npy"), X_train_geo)
    np.save(os.path.join(FEATURES_DIR, "tab_geo_test.npy"), X_test_geo)

    lgb_geo = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_geo.fit(X_train_geo, y_train_log)
    pred_geo = np.expm1(lgb_geo.predict(X_test_geo))
    m_geo = eval_metrics(y_test_usd, pred_geo)
    joblib.dump(lgb_geo, os.path.join(MODELS_DIR, "lgb_tab_geo.joblib"))

    comparison = pd.DataFrame([
        {'Configuration': 'Tabular Baseline (LightGBM)', 'Features': tab_train.shape[1], **m_tab},
        {'Configuration': 'Tabular + Geographic Features', 'Features': X_train_geo.shape[1], **m_geo}
    ])
    
    csv_out = os.path.join(RESULTS_DIR, "geographic_feature_comparison.csv")
    comparison.to_csv(csv_out, index=False)
    print(f"\nGeographic Feature Comparison:\n{comparison}")
    print("=== Phase 7 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "tabular_X_train.npy")):
        run_phase7()
    else:
        print("Waiting for Phase 0 and Phase 2 prerequisite files to complete.")
