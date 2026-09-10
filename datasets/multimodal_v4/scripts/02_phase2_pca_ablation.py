import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V3_FEATURES = os.path.join(ROOT_DIR, "multimodal_v3", "features")
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_COHORT = os.path.join(V4_DIR, "processed", "v4_cohort.csv")
RESULTS_DIR = os.path.join(V4_DIR, "results")
OUT_CSV = os.path.join(RESULTS_DIR, "pca_ablation.csv")

os.makedirs(RESULTS_DIR, exist_ok=True)

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

def run_phase2_pca_ablation(random_seed=42):
    print("=" * 70)
    print("PHASE 2: PCA DIMENSIONALITY REDUCTION ABLATION")
    print("=" * 70)
    
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    text_emb = np.load(os.path.join(V3_FEATURES, "text_embeddings.npy"))
    text_ids = pd.read_csv(os.path.join(V3_FEATURES, "text_ids.csv"))['id'].values
    image_emb = np.load(os.path.join(V3_FEATURES, "image_embeddings.npy"))
    image_ids = pd.read_csv(os.path.join(V3_FEATURES, "image_ids.csv"))['id'].values
    
    assert np.array_equal(df['id'].values, text_ids), "ID mismatch in text embeddings!"
    assert np.array_equal(df['id'].values, image_ids), "ID mismatch in image embeddings!"
    print("Alignment verified: Cohort IDs, Text IDs, and Image IDs match 100%.")
    
    num_cols = [
        'latitude_numeric', 'longitude_numeric', 'accommodates_numeric',
        'bathrooms_numeric', 'beds_numeric', 'num_reviews', 'rating',
        'rating_cleanliness', 'min_nights', 'avail_365'
    ]
    cat_cols = ['room_type_clean', 'property_type_grouped', 'is_superhost']
    y = df['price_usd'].values
    
    indices = np.arange(N)
    train_idx, test_idx = train_test_split(indices, test_size=0.20, random_state=random_seed)
    
    # Preprocess tabular strictly on training fold
    num_imputer = SimpleImputer(strategy='median')
    num_scaler = RobustScaler()
    X_num_tr = num_scaler.fit_transform(num_imputer.fit_transform(df.iloc[train_idx][num_cols]))
    X_num_te = num_scaler.transform(num_imputer.transform(df.iloc[test_idx][num_cols]))
    
    cat_ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat_tr = cat_ohe.fit_transform(df.iloc[train_idx][cat_cols])
    X_cat_te = cat_ohe.transform(df.iloc[test_idx][cat_cols])
    
    X_tab_tr = np.hstack([X_num_tr, X_cat_tr])
    X_tab_te = np.hstack([X_num_te, X_cat_te])
    tab_dim = X_tab_tr.shape[1]
    
    # Scale raw embeddings strictly on training fold
    text_scaler = StandardScaler()
    text_tr_sc = text_scaler.fit_transform(text_emb[train_idx])
    text_te_sc = text_scaler.transform(text_emb[test_idx])
    
    img_scaler = StandardScaler()
    img_tr_sc = img_scaler.fit_transform(image_emb[train_idx])
    img_te_sc = img_scaler.transform(image_emb[test_idx])
    
    y_tr = y[train_idx]
    y_te = y[test_idx]
    
    # Define 4 PCA conditions
    # 1. Existing PCA configuration: Text 32-d, Image 64-d
    # 2. No PCA: Full raw embeddings: Text 384-d, Image 1280-d
    # 3. PCA ~95% variance
    # 4. PCA ~99% variance
    
    configs = [
        {"name": "Existing PCA Config (V3)", "text_pca": 32, "img_pca": 64},
        {"name": "No PCA (Full Raw Embeddings)", "text_pca": None, "img_pca": None},
        {"name": "PCA Retaining ~95% Variance", "text_pca": 0.95, "img_pca": 0.95},
        {"name": "PCA Retaining ~99% Variance", "text_pca": 0.99, "img_pca": 0.99}
    ]
    
    results = []
    
    for cfg in configs:
        cname = cfg["name"]
        t_param = cfg["text_pca"]
        i_param = cfg["img_pca"]
        
        print(f"\nEvaluating: {cname}...")
        
        # Text representation
        if t_param is None:
            X_text_tr = text_tr_sc
            X_text_te = text_te_sc
            text_dim = X_text_tr.shape[1]
            text_exp_var = 100.0
        else:
            pca_t = PCA(n_components=t_param, random_state=random_seed)
            X_text_tr = pca_t.fit_transform(text_tr_sc)
            X_text_te = pca_t.transform(text_te_sc)
            text_dim = X_text_tr.shape[1]
            text_exp_var = float(pca_t.explained_variance_ratio_.sum() * 100.0)
            
        # Image representation
        if i_param is None:
            X_img_tr = img_tr_sc
            X_img_te = img_te_sc
            img_dim = X_img_tr.shape[1]
            img_exp_var = 100.0
        else:
            pca_i = PCA(n_components=i_param, random_state=random_seed)
            X_img_tr = pca_i.fit_transform(img_tr_sc)
            X_img_te = pca_i.transform(img_te_sc)
            img_dim = X_img_tr.shape[1]
            img_exp_var = float(pca_i.explained_variance_ratio_.sum() * 100.0)
            
        # Full Multimodal feature matrix
        X_mm_tr = np.hstack([X_tab_tr, X_text_tr, X_img_tr])
        X_mm_te = np.hstack([X_tab_te, X_text_te, X_img_te])
        total_dim = X_mm_tr.shape[1]
        
        print(f"  Text Dim: {text_dim} ({text_exp_var:.2f}% var), Image Dim: {img_dim} ({img_exp_var:.2f}% var)")
        print(f"  Total Multimodal Dim: {total_dim} (Tabular: {tab_dim})")
        
        model = TransformedTargetRegressor(
            regressor=HistGradientBoostingRegressor(
                max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
            ),
            func=np.log1p,
            inverse_func=np.expm1
        )
        
        model.fit(X_mm_tr, y_tr)
        y_pred = model.predict(X_mm_te)
        
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
            "Configuration": cname,
            "Text_Dim": text_dim,
            "Text_Explained_Var_Pct": round(text_exp_var, 2),
            "Image_Dim": img_dim,
            "Image_Explained_Var_Pct": round(img_exp_var, 2),
            "Total_Train_Dim": total_dim,
            "Total_Test_Dim": total_dim,
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2),
            "MedAE": round(medae, 2)
        })
        
    res_df = pd.DataFrame(results)
    res_df.to_csv(OUT_CSV, index=False)
    print(f"\nPCA Ablation results saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    run_phase2_pca_ablation()
