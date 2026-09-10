"""
Phase 5: PCA Dimensionality Reduction Ablation
Workspace: datasets/multimodal_v5/
Evaluates 4 PCA configurations strictly fit ONLY on training data:
A. No PCA (Full raw dimensions)
B. PCA retaining 95% variance
C. PCA retaining 99% variance
D. Aggressive PCA (32 dimensions, historical V3 reference)
Output: results/pca_ablation.csv
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error
from lightgbm import LGBMRegressor

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

print("=== Phase 5: PCA Dimensionality Reduction Ablation ===")

def eval_metrics(y_true, y_pred):
    y_pred = np.clip(y_pred, 1.0, None)
    return {
        'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
        'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        'R2': round(float(r2_score(y_true, y_pred)), 4),
        'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
        'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
    }

def run_phase5():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    # Base tabular features
    tab_train = np.load(os.path.join(FEATURES_DIR, "tabular_X_train.npy"))
    tab_test = np.load(os.path.join(FEATURES_DIR, "tabular_X_test.npy"))

    # CLIP image embeddings
    clip_train = np.load(os.path.join(FEATURES_DIR, "clip_img_train.npy"))
    clip_test = np.load(os.path.join(FEATURES_DIR, "clip_img_test.npy"))

    orig_dim = clip_train.shape[1]
    print(f"Original CLIP image embedding dimension: {orig_dim}")

    configs = [
        ('No PCA (Full Raw Embeddings)', None, 1.0),
        ('PCA retaining 99% variance', 0.99, None),
        ('PCA retaining 95% variance', 0.95, None),
        ('Aggressive PCA (32 dims, historical V3 reference)', 32, None)
    ]

    results = []

    for name, n_comp, expl_var in configs:
        print(f"\n--- Testing Configuration: {name} ---")
        
        if n_comp is None:
            reduced_train = clip_train
            reduced_test = clip_test
            retained_dim = orig_dim
            explained_var_pct = 100.0
            pca_model = None
        else:
            pca = PCA(n_components=n_comp, random_state=42)
            # CRITICAL SCIENTIFIC RULE: FIT ONLY ON TRAINING DATA
            pca.fit(clip_train)
            reduced_train = pca.transform(clip_train)
            reduced_test = pca.transform(clip_test)
            retained_dim = reduced_train.shape[1]
            explained_var_pct = float(np.sum(pca.explained_variance_ratio_) * 100.0)
            pca_model = pca
            joblib.dump(pca, os.path.join(MODELS_DIR, f"pca_{retained_dim}d.joblib"))

        print(f"  Dimensions: {orig_dim} -> {retained_dim} ({explained_var_pct:.2f}% variance retained)")

        # Evaluate Tabular + Visual Features with LightGBM
        X_tr = np.hstack([tab_train, reduced_train])
        X_te = np.hstack([tab_test, reduced_test])

        lgb = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
        lgb.fit(X_tr, y_train_log)
        pred_usd = np.expm1(lgb.predict(X_te))
        metrics = eval_metrics(y_test_usd, pred_usd)
        print(f"  Results: MAE=${metrics['MAE']}, RMSE=${metrics['RMSE']}, R2={metrics['R2']}, MAPE={metrics['MAPE']}%, MedAE=${metrics['MedAE']}")

        results.append({
            'Configuration': name,
            'Original Dimensions': orig_dim,
            'Reduced Dimensions': retained_dim,
            'Explained Variance (%)': round(explained_var_pct, 2),
            **metrics
        })

    res_df = pd.DataFrame(results).sort_values(by='MAE').reset_index(drop=True)
    csv_out = os.path.join(RESULTS_DIR, "pca_ablation.csv")
    res_df.to_csv(csv_out, index=False)
    print(f"\nPCA ablation results saved to {csv_out}:\n{res_df}")
    print("=== Phase 5 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "clip_img_train.npy")):
        run_phase5()
    else:
        print("Waiting for Phase 0, 1, 2, and 3 prerequisite files to complete.")
