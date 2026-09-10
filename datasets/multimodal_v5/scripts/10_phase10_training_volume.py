"""
Phase 10: Training Volume Sensitivity Analysis
Workspace: datasets/multimodal_v5/
Evaluates model performance scaling on the fixed test set across training volume subsets:
Subsets: 1,000 -> 2,000 -> 3,000 -> Maximum Available Train Size
Strictly uses the identical held-out test evaluation set.
Output: results/training_volume_sensitivity.csv
"""

import os
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"

os.makedirs(RESULTS_DIR, exist_ok=True)

print("=== Phase 10: Training Volume Sensitivity Analysis ===")

def eval_metrics(y_true, y_pred):
    y_pred = np.clip(y_pred, 1.0, None)
    return {
        'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
        'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        'R2': round(float(r2_score(y_true, y_pred)), 4),
        'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
        'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
    }

def run_phase10():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    X_train = np.load(os.path.join(FEATURES_DIR, "multimodal_concat_train.npy"))
    X_test = np.load(os.path.join(FEATURES_DIR, "multimodal_concat_test.npy"))

    total_train_size = len(train_df)
    print(f"Total training listings available: {total_train_size}")
    print(f"Fixed held-out test evaluation set: {len(test_df)} listings")

    # Define candidate volume subsets
    subsets = [1000, 2000, 3000, total_train_size]
    # Remove any subsets larger than total_train_size
    subsets = [s for s in subsets if s <= total_train_size]
    if total_train_size not in subsets:
        subsets.append(total_train_size)

    results = []
    rng = np.random.RandomState(42)

    for n_sub in subsets:
        print(f"\nEvaluating Training Volume: N = {n_sub:,} listings...")
        if n_sub < total_train_size:
            idx = rng.choice(total_train_size, size=n_sub, replace=False)
            idx = np.sort(idx)
            sub_X_tr = X_train[idx]
            sub_y_tr = y_train_log[idx]
        else:
            sub_X_tr = X_train
            sub_y_tr = y_train_log

        model = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
        model.fit(sub_X_tr, sub_y_tr)

        preds_usd = np.expm1(model.predict(X_test))
        metrics = eval_metrics(y_test_usd, preds_usd)
        print(f"  N={n_sub:,} Results: MAE=${metrics['MAE']}, RMSE=${metrics['RMSE']}, R2={metrics['R2']}, MAPE={metrics['MAPE']}%, MedAE=${metrics['MedAE']}")

        results.append({
            'Training Size (N)': n_sub,
            'Percentage of Train Set (%)': round(n_sub / total_train_size * 100.0, 1),
            **metrics
        })

    res_df = pd.DataFrame(results).sort_values(by='Training Size (N)').reset_index(drop=True)
    csv_out = os.path.join(RESULTS_DIR, "training_volume_sensitivity.csv")
    res_df.to_csv(csv_out, index=False)
    print(f"\nTraining Volume Sensitivity saved to {csv_out}:\n{res_df}")
    print("=== Phase 10 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "multimodal_concat_train.npy")):
        run_phase10()
    else:
        print("Waiting for Phase 8 prerequisite files to complete.")
