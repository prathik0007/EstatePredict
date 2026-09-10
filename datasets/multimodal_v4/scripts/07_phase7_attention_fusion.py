import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V3_FEATURES = os.path.join(ROOT_DIR, "multimodal_v3", "features")
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_COHORT = os.path.join(V4_DIR, "processed", "v4_cohort.csv")
RESULTS_DIR = os.path.join(V4_DIR, "results")
OUT_CSV = os.path.join(RESULTS_DIR, "attention_fusion_results.csv")

os.makedirs(RESULTS_DIR, exist_ok=True)

def compute_mape(y_true, y_pred):
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100.0

# 1. Simple Concatenation Baseline Network
class ConcatFusionModel(nn.Module):
    def __init__(self, tab_dim, text_dim, img_dim, proj_dim=64):
        super().__init__()
        self.tab_proj = nn.Sequential(
            nn.Linear(tab_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        self.text_proj = nn.Sequential(
            nn.Linear(text_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        self.img_proj = nn.Sequential(
            nn.Linear(img_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        # Direct concatenation of projected tokens: 3 * proj_dim
        concat_dim = proj_dim * 3
        self.head = nn.Sequential(
            nn.Linear(concat_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, x_tab, x_text, x_img):
        z_tab = self.tab_proj(x_tab)
        z_text = self.text_proj(x_text)
        z_img = self.img_proj(x_img)
        
        h_concat = torch.cat([z_tab, z_text, z_img], dim=-1)
        out = self.head(h_concat)
        return out.squeeze(-1)

# 2. Attention-Based Multimodal Fusion Network
class AttentionFusionModel(nn.Module):
    def __init__(self, tab_dim, text_dim, img_dim, proj_dim=64, num_heads=4):
        super().__init__()
        self.tab_proj = nn.Sequential(
            nn.Linear(tab_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        self.text_proj = nn.Sequential(
            nn.Linear(text_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        self.img_proj = nn.Sequential(
            nn.Linear(img_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU()
        )
        
        # Learnable modality token type embeddings
        self.modality_emb = nn.Parameter(torch.randn(1, 3, proj_dim) * 0.02)
        
        # Multi-Head Self-Attention over modal tokens [Tabular, Text, Image]
        self.mha = nn.MultiheadAttention(embed_dim=proj_dim, num_heads=num_heads, batch_first=True)
        self.ln = nn.LayerNorm(proj_dim)
        
        # Prediction Head
        concat_dim = proj_dim * 3
        self.head = nn.Sequential(
            nn.Linear(concat_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, x_tab, x_text, x_img):
        # 1. Project each modality to shared dim
        z_tab = self.tab_proj(x_tab).unsqueeze(1)    # [B, 1, d]
        z_text = self.text_proj(x_text).unsqueeze(1)  # [B, 1, d]
        z_img = self.img_proj(x_img).unsqueeze(1)    # [B, 1, d]
        
        # 2. Stack tokens
        tokens = torch.cat([z_tab, z_text, z_img], dim=1) # [B, 3, d]
        tokens = tokens + self.modality_emb
        
        # 3. Multi-Head Cross/Self-Attention
        attn_out, _ = self.mha(tokens, tokens, tokens)
        tokens_fused = self.ln(tokens + attn_out) # [B, 3, d]
        
        # 4. Flatten and predict
        h_fused = tokens_fused.reshape(tokens_fused.size(0), -1) # [B, 3*d]
        out = self.head(h_fused)
        return out.squeeze(-1)

def train_and_evaluate_model(model, train_loader, val_loader, test_loader, y_test_usd, lr=1e-3, max_epochs=80, patience=15):
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion = nn.SmoothL1Loss()
    
    best_val_loss = float('inf')
    best_weights = None
    patience_counter = 0
    
    for epoch in range(max_epochs):
        model.train()
        train_loss = 0.0
        for b_tab, b_text, b_img, b_y in train_loader:
            optimizer.zero_grad()
            pred = model(b_tab, b_text, b_img)
            loss = criterion(pred, b_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(b_y)
            
        train_loss /= len(train_loader.dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for b_tab, b_text, b_img, b_y in val_loader:
                pred = model(b_tab, b_text, b_img)
                loss = criterion(pred, b_y)
                val_loss += loss.item() * len(b_y)
        val_loss /= len(val_loader.dataset)
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                break
                
    # Restore best checkpoint
    model.load_state_dict(best_weights)
    model.eval()
    
    preds_log = []
    with torch.no_grad():
        for b_tab, b_text, b_img, _ in test_loader:
            pred = model(b_tab, b_text, b_img)
            preds_log.append(pred.cpu().numpy())
            
    preds_log = np.concatenate(preds_log)
    preds_usd = np.expm1(preds_log)
    
    mae = mean_absolute_error(y_test_usd, preds_usd)
    rmse = np.sqrt(mean_squared_error(y_test_usd, preds_usd))
    r2 = r2_score(y_test_usd, preds_usd)
    mape = compute_mape(y_test_usd, preds_usd)
    medae = median_absolute_error(y_test_usd, preds_usd)
    
    return mae, rmse, r2, mape, medae

def run_phase7_attention_fusion_experiments(random_seed=42):
    print("=" * 70)
    print("PHASE 7: LEARNED ATTENTION-BASED MULTIMODAL FUSION ARCHITECTURE")
    print("=" * 70)
    torch.manual_seed(random_seed)
    np.random.seed(random_seed)
    
    df = pd.read_csv(V4_COHORT)
    N = len(df)
    
    text_emb = np.load(os.path.join(V3_FEATURES, "text_embeddings.npy"))
    image_emb = np.load(os.path.join(V3_FEATURES, "image_embeddings.npy"))
    
    num_cols = [
        'latitude_numeric', 'longitude_numeric', 'accommodates_numeric',
        'bathrooms_numeric', 'beds_numeric', 'num_reviews', 'rating',
        'rating_cleanliness', 'min_nights', 'avail_365'
    ]
    cat_cols = ['room_type_clean', 'property_type_grouped', 'is_superhost']
    y_usd = df['price_usd'].values
    y_log = np.log1p(y_usd)
    
    # 80/20 train/test split
    indices = np.arange(N)
    train_val_idx, test_idx = train_test_split(indices, test_size=0.20, random_state=random_seed)
    
    # Within 80%, split into 80% train ($N=1,152$) and 20% val ($N=288$)
    train_sub_idx, val_sub_idx = train_test_split(train_val_idx, test_size=0.20, random_state=random_seed)
    
    print(f"Dataset Partitions:")
    print(f"  - Train Partition: {len(train_sub_idx)} listings")
    print(f"  - Val Partition  : {len(val_sub_idx)} listings (for early stopping & checkpointing)")
    print(f"  - Test Partition : {len(test_idx)} listings (strictly held out)")
    
    # Tabular preprocessing
    num_imputer = SimpleImputer(strategy='median')
    num_scaler = RobustScaler()
    X_num_tr = num_scaler.fit_transform(num_imputer.fit_transform(df.iloc[train_sub_idx][num_cols]))
    X_num_val = num_scaler.transform(num_imputer.transform(df.iloc[val_sub_idx][num_cols]))
    X_num_te = num_scaler.transform(num_imputer.transform(df.iloc[test_idx][num_cols]))
    
    cat_ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    X_cat_tr = cat_ohe.fit_transform(df.iloc[train_sub_idx][cat_cols])
    X_cat_val = cat_ohe.transform(df.iloc[val_sub_idx][cat_cols])
    X_cat_te = cat_ohe.transform(df.iloc[test_idx][cat_cols])
    
    X_tab_tr = np.hstack([X_num_tr, X_cat_tr]).astype(np.float32)
    X_tab_val = np.hstack([X_num_val, X_cat_val]).astype(np.float32)
    X_tab_te = np.hstack([X_num_te, X_cat_te]).astype(np.float32)
    
    # Text & Image scaling
    t_sc = StandardScaler()
    X_text_tr = t_sc.fit_transform(text_emb[train_sub_idx]).astype(np.float32)
    X_text_val = t_sc.transform(text_emb[val_sub_idx]).astype(np.float32)
    X_text_te = t_sc.transform(text_emb[test_idx]).astype(np.float32)
    
    i_sc = StandardScaler()
    X_img_tr = i_sc.fit_transform(image_emb[train_sub_idx]).astype(np.float32)
    X_img_val = i_sc.transform(image_emb[val_sub_idx]).astype(np.float32)
    X_img_te = i_sc.transform(image_emb[test_idx]).astype(np.float32)
    
    y_tr = y_log[train_sub_idx].astype(np.float32)
    y_val = y_log[val_sub_idx].astype(np.float32)
    y_te_usd = y_usd[test_idx]
    
    # DataLoaders
    train_dataset = TensorDataset(torch.from_numpy(X_tab_tr), torch.from_numpy(X_text_tr), torch.from_numpy(X_img_tr), torch.from_numpy(y_tr))
    val_dataset = TensorDataset(torch.from_numpy(X_tab_val), torch.from_numpy(X_text_val), torch.from_numpy(X_img_val), torch.from_numpy(y_val))
    test_dataset = TensorDataset(torch.from_numpy(X_tab_te), torch.from_numpy(X_text_te), torch.from_numpy(X_img_te), torch.from_numpy(y_log[test_idx].astype(np.float32)))
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    
    tab_dim = X_tab_tr.shape[1]
    text_dim = X_text_tr.shape[1]
    img_dim = X_img_tr.shape[1]
    
    print(f"\nModality Dimensions: Tabular={tab_dim}, Text={text_dim}, Image={img_dim}")
    
    models_to_test = [
        ("Simple Concatenation Baseline (MLP)", ConcatFusionModel(tab_dim, text_dim, img_dim, proj_dim=64)),
        ("Learned Attention-Based Multimodal Fusion", AttentionFusionModel(tab_dim, text_dim, img_dim, proj_dim=64, num_heads=4))
    ]
    
    results = []
    
    for name, model in models_to_test:
        print(f"\nTraining & Benchmarking: {name}...")
        mae, rmse, r2, mape, medae = train_and_evaluate_model(
            model, train_loader, val_loader, test_loader, y_te_usd, lr=1e-3, max_epochs=80, patience=15
        )
        print(f"  MAE   : ${mae:.2f}")
        print(f"  RMSE  : ${rmse:.2f}")
        print(f"  R2    : {r2:.4f}")
        print(f"  MAPE  : {mape:.2f}%")
        print(f"  MedAE : ${medae:.2f}")
        
        results.append({
            "Fusion_Architecture": name,
            "Projection_Dimension": 64,
            "Attention_Heads": 4 if "Attention" in name else 0,
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2),
            "MedAE": round(medae, 2),
            "Test_N": len(test_idx)
        })
        
    res_df = pd.DataFrame(results)
    res_df.to_csv(OUT_CSV, index=False)
    print(f"\nAttention Fusion benchmark results saved to: {OUT_CSV}")
    print(res_df.to_string(index=False))

if __name__ == "__main__":
    run_phase7_attention_fusion_experiments()
