import os
import sys
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
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
FEATURES_DIR = os.path.join(V4_DIR, "features")
RESULTS_DIR = os.path.join(V4_DIR, "results")
BGE_NPY = os.path.join(FEATURES_DIR, "bge_text_embeddings.npy")
E5_NPY = os.path.join(FEATURES_DIR, "e5_text_embeddings.npy")
OUT_CSV = os.path.join(RESULTS_DIR, "text_embedding_comparison.csv")

os.makedirs(FEATURES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

def extract_text_embeddings():
    df = pd.read_csv(V4_COHORT)
    texts = df['combined_text'].fillna("").tolist()
    N = len(df)
    
    # 1. BGE Small (384-d)
    if os.path.exists(BGE_NPY):
        print("BGE embeddings found on disk. Loading...")
        bge_emb = np.load(BGE_NPY)
    else:
        print("Extracting BGE embeddings (BAAI/bge-small-en-v1.5)...")
        bge_model = SentenceTransformer('BAAI/bge-small-en-v1.5', device='cpu')
        bge_emb = bge_model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
        np.save(BGE_NPY, bge_emb)
        print(f"Saved BGE embeddings to {BGE_NPY} shape: {bge_emb.shape}")
        
    # 2. E5 Small (384-d)
    if os.path.exists(E5_NPY):
        print("E5 embeddings found on disk. Loading...")
        e5_emb = np.load(E5_NPY)
    else:
        print("Extracting E5 embeddings (intfloat/e5-small-v2)...")
        e5_model = SentenceTransformer('intfloat/e5-small-v2', device='cpu')
        # E5 requires "passage: " prefix for document embeddings
        e5_texts = [f"passage: {t}" for t in texts]
        e5_emb = e5_model.encode(e5_texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
        np.save(E5_NPY, e5_emb)
        print(f"Saved E5 embeddings to {E5_NPY} shape: {e5_emb.shape}")
        
    return bge_emb, e5_emb

def run_phase4_comparison(random_seed=42):
    print("=" * 70)
    print("PHASE 4: BETTER TEXT EMBEDDING COMPARISON BENCHMARK")
    print("=" * 70)
    
    bge_emb, e5_emb = extract_text_embeddings()
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    # V3 MiniLM text embeddings
    minilm_emb = np.load(os.path.join(V3_FEATURES, "text_embeddings.npy"))
    
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
    
    y_tr = y[train_idx]
    y_te = y[test_idx]
    
    # Text models to compare (both PCA 32-d and raw 384-d)
    text_models = {
        "all-MiniLM-L6-v2 (V3 Baseline)": minilm_emb,
        "BAAI/bge-small-en-v1.5": bge_emb,
        "intfloat/e5-small-v2": e5_emb
    }
    
    results = []
    
    # Benchmark Tabular Only first as control
    base_model = TransformedTargetRegressor(
        regressor=HistGradientBoostingRegressor(
            max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
        ),
        func=np.log1p,
        inverse_func=np.expm1
    )
    base_model.fit(X_tab_tr, y_tr)
    y_pred_tab = base_model.predict(X_tab_te)
    
    results.append({
        "Model": "HistGradientBoosting",
        "Text_Embedding": "None (Tabular Only)",
        "Text_Dim": 0,
        "Total_Features": X_tab_tr.shape[1],
        "MAE": round(mean_absolute_error(y_te, y_pred_tab), 2),
        "RMSE": round(np.sqrt(mean_squared_error(y_te, y_pred_tab)), 2),
        "R2": round(r2_score(y_te, y_pred_tab), 4),
        "MAPE": round(compute_mape(y_te, y_pred_tab), 2),
        "MedAE": round(median_absolute_error(y_te, y_pred_tab), 2)
    })
    
    for tname, emb in text_models.items():
        # 1. PCA 32-d
        pca = PCA(n_components=32, random_state=random_seed)
        sc = StandardScaler()
        txt_tr_pca = pca.fit_transform(sc.fit_transform(emb[train_idx]))
        txt_te_pca = pca.transform(sc.transform(emb[test_idx]))
        
        X_tr_pca = np.hstack([X_tab_tr, txt_tr_pca])
        X_te_pca = np.hstack([X_tab_te, txt_te_pca])
        
        m_pca = TransformedTargetRegressor(
            regressor=HistGradientBoostingRegressor(
                max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
            ),
            func=np.log1p,
            inverse_func=np.expm1
        )
        m_pca.fit(X_tr_pca, y_tr)
        y_pred_pca = m_pca.predict(X_te_pca)
        
        results.append({
            "Model": "HistGradientBoosting",
            "Text_Embedding": f"{tname} (PCA 32-d)",
            "Text_Dim": 32,
            "Total_Features": X_tr_pca.shape[1],
            "MAE": round(mean_absolute_error(y_te, y_pred_pca), 2),
            "RMSE": round(np.sqrt(mean_squared_error(y_te, y_pred_pca)), 2),
            "R2": round(r2_score(y_te, y_pred_pca), 4),
            "MAPE": round(compute_mape(y_te, y_pred_pca), 2),
            "MedAE": round(median_absolute_error(y_te, y_pred_pca), 2)
        })
        
        # 2. Raw 384-d
        sc_raw = StandardScaler()
        txt_tr_raw = sc_raw.fit_transform(emb[train_idx])
        txt_te_raw = sc_raw.transform(emb[test_idx])
        
        X_tr_raw = np.hstack([X_tab_tr, txt_tr_raw])
        X_te_raw = np.hstack([X_tab_te, txt_te_raw])
        
        m_raw = TransformedTargetRegressor(
            regressor=HistGradientBoostingRegressor(
                max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
            ),
            func=np.log1p,
            inverse_func=np.expm1
        )
        m_raw.fit(X_tr_raw, y_tr)
        y_pred_raw = m_raw.predict(X_te_raw)
        
        results.append({
            "Model": "HistGradientBoosting",
            "Text_Embedding": f"{tname} (Raw 384-d)",
            "Text_Dim": 384,
            "Total_Features": X_tr_raw.shape[1],
            "MAE": round(mean_absolute_error(y_te, y_pred_raw), 2),
            "RMSE": round(np.sqrt(mean_squared_error(y_te, y_pred_raw)), 2),
            "R2": round(r2_score(y_te, y_pred_raw), 4),
            "MAPE": round(compute_mape(y_te, y_pred_raw), 2),
            "MedAE": round(median_absolute_error(y_te, y_pred_raw), 2)
        })
        
    res_df = pd.DataFrame(results)
    res_df.to_csv(OUT_CSV, index=False)
    print(f"\nText embedding comparison results saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    run_phase4_comparison()
