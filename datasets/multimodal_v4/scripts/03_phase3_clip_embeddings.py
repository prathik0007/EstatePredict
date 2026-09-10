import os
import sys
import torch
import torch.nn.functional as F
import numpy as np
import pandas as pd
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
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
V3_IMAGES = os.path.join(ROOT_DIR, "multimodal_v3", "images")
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_COHORT = os.path.join(V4_DIR, "processed", "v4_cohort.csv")
FEATURES_DIR = os.path.join(V4_DIR, "features")
RESULTS_DIR = os.path.join(V4_DIR, "results")
CLIP_TEXT_NPY = os.path.join(FEATURES_DIR, "clip_text_embeddings.npy")
CLIP_IMG_NPY = os.path.join(FEATURES_DIR, "clip_image_embeddings.npy")
CLIP_IDS_CSV = os.path.join(FEATURES_DIR, "clip_ids.csv")
OUT_CSV = os.path.join(RESULTS_DIR, "clip_comparison.csv")

os.makedirs(FEATURES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

MODEL_ID = "wkcn/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M"

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

def extract_clip_embeddings():
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    if os.path.exists(CLIP_TEXT_NPY) and os.path.exists(CLIP_IMG_NPY) and os.path.exists(CLIP_IDS_CSV):
        print("CLIP embeddings already extracted on disk. Loading...")
        text_emb = np.load(CLIP_TEXT_NPY)
        image_emb = np.load(CLIP_IMG_NPY)
        clip_ids = pd.read_csv(CLIP_IDS_CSV)['id'].values
        assert np.array_equal(df['id'].values, clip_ids), "CLIP ID mismatch!"
        return text_emb, image_emb, clip_ids
        
    print("=" * 70)
    print(f"EXTRACTING CLIP MULTIMODAL EMBEDDINGS ({MODEL_ID})")
    print("=" * 70)
    
    device = "cpu"
    print("Loading CLIP model on:", device)
    model = CLIPModel.from_pretrained(MODEL_ID).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_ID)
    model.eval()
    
    # 1. Text Embeddings
    print("Extracting CLIP text embeddings for 1,800 listings...")
    texts = df['combined_text'].fillna("").tolist()
    text_embeddings = []
    
    batch_size = 64
    for i in range(0, N, batch_size):
        batch_texts = texts[i:i + batch_size]
        inputs = processor(text=batch_texts, return_tensors="pt", padding=True, truncation=True, max_length=77).to(device)
        with torch.no_grad():
            out = model.get_text_features(**inputs)
            text_features = out.pooler_output if hasattr(out, 'pooler_output') else out
            text_features = F.normalize(text_features, p=2, dim=-1)
            text_embeddings.append(text_features.cpu().numpy())
            
        if (i // batch_size) % 5 == 0 or i + batch_size >= N:
            print(f"  Processed {min(i + batch_size, N)} / {N} texts...")
            
    text_emb = np.vstack(text_embeddings)
    print(f"CLIP Text Embeddings shape: {text_emb.shape}")
    
    # 2. Image Embeddings
    print("\nExtracting CLIP image embeddings for 1,800 listings...")
    img_embeddings = []
    img_batch_size = 32
    
    for i in range(0, N, img_batch_size):
        batch_ids = df['id'].iloc[i:i + img_batch_size].values
        batch_imgs = []
        for lid in batch_ids:
            img_path = os.path.join(V3_IMAGES, f"{lid}.jpg")
            try:
                img = Image.open(img_path).convert("RGB").resize((224, 224))
            except Exception as e:
                img = Image.new("RGB", (224, 224), color=0)
            batch_imgs.append(img)
            
        inputs = processor(images=batch_imgs, return_tensors="pt").to(device)
        with torch.no_grad():
            out = model.get_image_features(**inputs)
            img_features = out.pooler_output if hasattr(out, 'pooler_output') else out
            img_features = F.normalize(img_features, p=2, dim=-1)
            img_embeddings.append(img_features.cpu().numpy())
            
        if (i // img_batch_size) % 10 == 0 or i + img_batch_size >= N:
            print(f"  Processed {min(i + img_batch_size, N)} / {N} images...")
            
    image_emb = np.vstack(img_embeddings)
    print(f"CLIP Image Embeddings shape: {image_emb.shape}")
    
    # Save artifacts
    np.save(CLIP_TEXT_NPY, text_emb)
    np.save(CLIP_IMG_NPY, image_emb)
    df[['id']].to_csv(CLIP_IDS_CSV, index=False)
    print(f"Saved CLIP text embeddings to {CLIP_TEXT_NPY}")
    print(f"Saved CLIP image embeddings to {CLIP_IMG_NPY}")
    print(f"Saved CLIP IDs to {CLIP_IDS_CSV}")
    
    return text_emb, image_emb, df['id'].values

def evaluate_clip_comparison(random_seed=42):
    text_emb, image_emb, clip_ids = extract_clip_embeddings()
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    # V3 features for direct comparison
    v3_text_emb = np.load(os.path.join(V3_FEATURES, "text_embeddings.npy"))
    v3_image_emb = np.load(os.path.join(V3_FEATURES, "image_embeddings.npy"))
    
    assert np.array_equal(df['id'].values, clip_ids), "ID mismatch in CLIP features!"
    
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
    
    # V3 PCA Text (32-d) & Image (64-d)
    v3_pca_t = PCA(n_components=32, random_state=random_seed)
    v3_pca_i = PCA(n_components=64, random_state=random_seed)
    v3_txt_tr = v3_pca_t.fit_transform(StandardScaler().fit_transform(v3_text_emb[train_idx]))
    v3_txt_te = v3_pca_t.transform(StandardScaler().fit(v3_text_emb[train_idx]).transform(v3_text_emb[test_idx]))
    v3_img_tr = v3_pca_i.fit_transform(StandardScaler().fit_transform(v3_image_emb[train_idx]))
    v3_img_te = v3_pca_i.transform(StandardScaler().fit(v3_image_emb[train_idx]).transform(v3_image_emb[test_idx]))
    
    # CLIP PCA Text (32-d) & Image (64-d)
    clip_pca_t = PCA(n_components=32, random_state=random_seed)
    clip_pca_i = PCA(n_components=64, random_state=random_seed)
    clip_txt_tr = clip_pca_t.fit_transform(StandardScaler().fit_transform(text_emb[train_idx]))
    clip_txt_te = clip_pca_t.transform(StandardScaler().fit(text_emb[train_idx]).transform(text_emb[test_idx]))
    clip_img_tr = clip_pca_i.fit_transform(StandardScaler().fit_transform(image_emb[train_idx]))
    clip_img_te = clip_pca_i.transform(StandardScaler().fit(image_emb[train_idx]).transform(image_emb[test_idx]))
    
    # Define models to compare
    spaces = {
        "Tabular Only (V3 Baseline)": (X_tab_tr, X_tab_te),
        "Tabular + V3 Text (MiniLM 32-d)": (np.hstack([X_tab_tr, v3_txt_tr]), np.hstack([X_tab_te, v3_txt_te])),
        "Tabular + V3 Image (EfficientNet 64-d)": (np.hstack([X_tab_tr, v3_img_tr]), np.hstack([X_tab_te, v3_img_te])),
        "Full Multimodal V3 (MiniLM + EfficientNet 119-d)": (np.hstack([X_tab_tr, v3_txt_tr, v3_img_tr]), np.hstack([X_tab_te, v3_txt_te, v3_img_te])),
        "Tabular + CLIP Text (PCA 32-d)": (np.hstack([X_tab_tr, clip_txt_tr]), np.hstack([X_tab_te, clip_txt_te])),
        "Tabular + CLIP Image (PCA 64-d)": (np.hstack([X_tab_tr, clip_img_tr]), np.hstack([X_tab_te, clip_img_te])),
        "Full Multimodal CLIP (CLIP Text + Image 119-d)": (np.hstack([X_tab_tr, clip_txt_tr, clip_img_tr]), np.hstack([X_tab_te, clip_txt_te, clip_img_te]))
    }
    
    y_tr = y[train_idx]
    y_te = y[test_idx]
    
    results = []
    print("\n" + "=" * 70)
    print("EVALUATING CLIP VS V3 MULTIMODAL BENCHMARK (USD PRICE SCALE):")
    print("=" * 70)
    
    for name, (X_tr, X_te) in spaces.items():
        model = TransformedTargetRegressor(
            regressor=HistGradientBoostingRegressor(
                max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12, random_state=random_seed
            ),
            func=np.log1p,
            inverse_func=np.expm1
        )
        model.fit(X_tr, y_tr)
        y_pred = model.predict(X_te)
        
        mae = mean_absolute_error(y_te, y_pred)
        rmse = np.sqrt(mean_squared_error(y_te, y_pred))
        r2 = r2_score(y_te, y_pred)
        mape = compute_mape(y_te, y_pred)
        medae = median_absolute_error(y_te, y_pred)
        
        print(f"\n[{name}] ({X_tr.shape[1]} features):")
        print(f"  MAE   : ${mae:.2f}")
        print(f"  RMSE  : ${rmse:.2f}")
        print(f"  R2    : {r2:.4f}")
        print(f"  MAPE  : {mape:.2f}%")
        print(f"  MedAE : ${medae:.2f}")
        
        results.append({
            "Representation": name,
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
    print(f"\nCLIP comparison results saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    evaluate_clip_comparison()
