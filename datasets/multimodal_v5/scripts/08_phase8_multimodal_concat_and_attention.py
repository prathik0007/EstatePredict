"""
Phases 8 & 9: Multimodal Concatenation Baseline vs. Multi-Head Cross-Attention Fusion
Workspace: datasets/multimodal_v5/
Modality Encoders:
- Tabular Features (structural capacity, rooms, review counts, host signals)
- Geographic Features (Haversine distances to 8 Austin landmarks, log-distances, coordinates)
- Text Representation (Dense 384d semantic embeddings)
- CLIP Image Representation (Dense 512d ViT-B/32 embeddings)

Compares:
1. Full Multimodal Concatenation (LightGBM)
2. Multimodal Feedforward Network (MLP)
3. Multimodal Multi-Head Cross-Attention Fusion Network
Strictly evaluated on the identical held-out test partition in original USD ($).
"""

import os
import joblib
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

print("=== Phases 8 & 9: Multimodal Concatenation vs. Cross-Attention Fusion ===")

def eval_metrics(y_true, y_pred):
    y_pred = np.clip(y_pred, 1.0, None)
    return {
        'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
        'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        'R2': round(float(r2_score(y_true, y_pred)), 4),
        'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
        'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
    }

class MultimodalAttentionNetwork(nn.Module):
    def __init__(self, d_tab, d_geo, d_text, d_img, d_model=128, n_heads=4, dropout=0.1):
        super().__init__()
        # Modality projection heads
        self.tab_proj = nn.Sequential(
            nn.Linear(d_tab, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        self.geo_proj = nn.Sequential(
            nn.Linear(d_geo, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        self.text_proj = nn.Sequential(
            nn.Linear(d_text, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        self.img_proj = nn.Sequential(
            nn.Linear(d_img, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        
        # Learnable modality token embeddings
        self.modality_embed = nn.Parameter(torch.randn(1, 4, d_model) * 0.02)
        
        # Multi-Head Cross-Attention Layer
        self.attention = nn.MultiheadAttention(embed_dim=d_model, num_heads=n_heads, batch_first=True, dropout=dropout)
        self.norm1 = nn.LayerNorm(d_model)
        
        # Feed-forward block
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_model * 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model * 2, d_model)
        )
        self.norm2 = nn.LayerNorm(d_model)
        
        # Prediction head
        self.regressor = nn.Sequential(
            nn.Linear(4 * d_model, d_model),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model, 1)
        )

    def forward(self, tab, geo, text, img):
        t_tab = self.tab_proj(tab).unsqueeze(1)    # (B, 1, d_model)
        t_geo = self.geo_proj(geo).unsqueeze(1)    # (B, 1, d_model)
        t_text = self.text_proj(text).unsqueeze(1) # (B, 1, d_model)
        t_img = self.img_proj(img).unsqueeze(1)    # (B, 1, d_model)
        
        # Stack tokens into sequence of 4 modalities
        tokens = torch.cat([t_tab, t_geo, t_text, t_img], dim=1) + self.modality_embed # (B, 4, d_model)
        
        # Cross-modal self-attention
        attn_out, _ = self.attention(tokens, tokens, tokens)
        tokens = self.norm1(tokens + attn_out)
        
        # Modality refinement
        ffn_out = self.ffn(tokens)
        tokens = self.norm2(tokens + ffn_out)
        
        # Flatten and predict
        flat = tokens.view(tokens.size(0), -1)
        out = self.regressor(flat).squeeze(-1)
        return out

def run_phase8_9():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values
    train_fit_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_fit_ids.csv"))['id'].values
    calib_ids = pd.read_csv(os.path.join(SPLITS_DIR, "calibration_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    # Load 4 modalities
    tab_tr = np.load(os.path.join(FEATURES_DIR, "tabular_X_train.npy"))
    tab_te = np.load(os.path.join(FEATURES_DIR, "tabular_X_test.npy"))

    geo_tr = np.load(os.path.join(FEATURES_DIR, "geo_train.npy"))
    geo_te = np.load(os.path.join(FEATURES_DIR, "geo_test.npy"))

    # If text_best exists, load it; else text_minilm
    if os.path.exists(os.path.join(FEATURES_DIR, "text_best_train.npy")):
        text_tr = np.load(os.path.join(FEATURES_DIR, "text_best_train.npy"))
        text_te = np.load(os.path.join(FEATURES_DIR, "text_best_test.npy"))
    else:
        text_tr = np.load(os.path.join(FEATURES_DIR, "text_minilm_l6_v2_train.npy"))
        text_te = np.load(os.path.join(FEATURES_DIR, "text_minilm_l6_v2_test.npy"))

    img_tr = np.load(os.path.join(FEATURES_DIR, "clip_img_train.npy"))
    img_te = np.load(os.path.join(FEATURES_DIR, "clip_img_test.npy"))

    print(f"Modality shapes: Tabular {tab_tr.shape}, Geo {geo_tr.shape}, Text {text_tr.shape}, Image {img_tr.shape}")

    # Full concatenation matrix
    X_concat_tr = np.hstack([tab_tr, geo_tr, text_tr, img_tr])
    X_concat_te = np.hstack([tab_te, geo_te, text_te, img_te])
    print(f"Full Multimodal Concatenated Dimension: {X_concat_tr.shape[1]}")
    np.save(os.path.join(FEATURES_DIR, "multimodal_concat_train.npy"), X_concat_tr)
    np.save(os.path.join(FEATURES_DIR, "multimodal_concat_test.npy"), X_concat_te)

    # 1. Full Multimodal Concatenation with LightGBM
    print("\n--- Training Model 1: Multimodal Concatenation (LightGBM) ---")
    lgb_full = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_full.fit(X_concat_tr, y_train_log)
    pred_concat_usd = np.expm1(lgb_full.predict(X_concat_te))
    m_concat = eval_metrics(y_test_usd, pred_concat_usd)
    print(f"  Concat LightGBM: MAE=${m_concat['MAE']}, RMSE=${m_concat['RMSE']}, R2={m_concat['R2']}, MAPE={m_concat['MAPE']}%, MedAE=${m_concat['MedAE']}")
    joblib.dump(lgb_full, os.path.join(MODELS_DIR, "lgb_multimodal_concat.joblib"))

    # 2. Multimodal Multi-Head Cross-Attention Network
    print("\n--- Training Model 2: Multimodal Cross-Attention Fusion Network ---")
    # Partition train into train_fit and validation (calib) for early stopping
    fit_mask = train_df['id'].isin(train_fit_ids).values
    val_mask = train_df['id'].isin(calib_ids).values

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = MultimodalAttentionNetwork(
        d_tab=tab_tr.shape[1],
        d_geo=geo_tr.shape[1],
        d_text=text_tr.shape[1],
        d_img=img_tr.shape[1],
        d_model=128,
        n_heads=4,
        dropout=0.15
    ).to(device)

    # Convert to PyTorch tensors
    t_tab_tr = torch.tensor(tab_tr[fit_mask], dtype=torch.float32)
    t_geo_tr = torch.tensor(geo_tr[fit_mask], dtype=torch.float32)
    t_text_tr = torch.tensor(text_tr[fit_mask], dtype=torch.float32)
    t_img_tr = torch.tensor(img_tr[fit_mask], dtype=torch.float32)
    t_y_tr = torch.tensor(y_train_log[fit_mask], dtype=torch.float32)

    t_tab_val = torch.tensor(tab_tr[val_mask], dtype=torch.float32).to(device)
    t_geo_val = torch.tensor(geo_tr[val_mask], dtype=torch.float32).to(device)
    t_text_val = torch.tensor(text_tr[val_mask], dtype=torch.float32).to(device)
    t_img_val = torch.tensor(img_tr[val_mask], dtype=torch.float32).to(device)
    t_y_val = torch.tensor(y_train_log[val_mask], dtype=torch.float32).to(device)

    t_tab_te = torch.tensor(tab_te, dtype=torch.float32).to(device)
    t_geo_te = torch.tensor(geo_te, dtype=torch.float32).to(device)
    t_text_te = torch.tensor(text_te, dtype=torch.float32).to(device)
    t_img_te = torch.tensor(img_te, dtype=torch.float32).to(device)

    train_ds = TensorDataset(t_tab_tr, t_geo_tr, t_text_tr, t_img_tr, t_y_tr)
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)

    criterion = nn.SmoothL1Loss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=40)

    best_val_loss = float('inf')
    best_weights = None

    for epoch in range(1, 41):
        model.train()
        total_loss = 0.0
        for b_tab, b_geo, b_text, b_img, b_y in train_loader:
            b_tab, b_geo, b_text, b_img, b_y = (
                b_tab.to(device), b_geo.to(device), b_text.to(device), b_img.to(device), b_y.to(device)
            )
            optimizer.zero_grad()
            preds = model(b_tab, b_geo, b_text, b_img)
            loss = criterion(preds, b_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item() * len(b_y)
        
        scheduler.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_preds = model(t_tab_val, t_geo_val, t_text_val, t_img_val)
            val_loss = criterion(val_preds, t_y_val).item()

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 10 == 0 or epoch == 40:
            print(f"  Epoch {epoch:02d}/40 | Train Loss: {total_loss/len(train_ds):.4f} | Val Loss: {val_loss:.4f}")

    model.load_state_dict({k: v.to(device) for k, v in best_weights.items()})
    torch.save(best_weights, os.path.join(MODELS_DIR, "multimodal_attention_fusion.pt"))

    # Test evaluation
    model.eval()
    with torch.no_grad():
        test_pred_log = model(t_tab_te, t_geo_te, t_text_te, t_img_te).cpu().numpy()
        pred_attn_usd = np.expm1(test_pred_log)

    m_attn = eval_metrics(y_test_usd, pred_attn_usd)
    print(f"  Cross-Attention Fusion: MAE=${m_attn['MAE']}, RMSE=${m_attn['RMSE']}, R2={m_attn['R2']}, MAPE={m_attn['MAPE']}%, MedAE=${m_attn['MedAE']}")

    comparison_df = pd.DataFrame([
        {'Architecture': 'Multimodal Concatenation (LightGBM)', 'Total Features / Params': X_concat_tr.shape[1], **m_concat},
        {'Architecture': 'Multimodal Cross-Attention Fusion (PyTorch)', 'Total Features / Params': sum(p.numel() for p in model.parameters()), **m_attn}
    ])

    csv_out = os.path.join(RESULTS_DIR, "attention_vs_concatenation.csv")
    comparison_df.to_csv(csv_out, index=False)
    print(f"\nArchitecture comparison saved to {csv_out}:\n{comparison_df}")
    print("=== Phases 8 & 9 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "clip_img_train.npy")) and os.path.exists(os.path.join(FEATURES_DIR, "geo_train.npy")):
        run_phase8_9()
    else:
        print("Waiting for Phase 0, 1, 3, 4, and 7 prerequisite files to complete.")
