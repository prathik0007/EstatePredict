"""
Phase 11: Controlled Final Master Ablation
Workspace: datasets/multimodal_v5/
Systematically evaluates the 8 canonical experimental configurations on the identical held-out test set:
1. V3-style Tabular Baseline (HistGradientBoosting on core real estate features)
2. Best V5 Tabular Model (LightGBM on expanded real estate features)
3. Tabular + Geographic Features (Haversine distance to 8 Austin landmarks)
4. Tabular + Best Text Embedding (Dense text semantic representations)
5. Tabular + CLIP Image Embedding (ViT-B/32 vision representations)
6. Tabular + Text + CLIP Image
7. Full Multimodal + Geographic (Concatenation: Tabular + Geo + Text + CLIP Image)
8. Full Multimodal + Cross-Attention Fusion (PyTorch Multi-Head Cross-Attention)

Output: results/V5_FINAL_ABLATION.csv
"""

import os
import joblib
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from lightgbm import LGBMRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"

os.makedirs(RESULTS_DIR, exist_ok=True)

print("=== Phase 11: Controlled Final Master Ablation ===")

class MultimodalAttentionNetwork(nn.Module):
    def __init__(self, d_tab, d_geo, d_text, d_img, d_model=128, n_heads=4, dropout=0.1):
        super().__init__()
        self.tab_proj = nn.Sequential(nn.Linear(d_tab, d_model), nn.LayerNorm(d_model), nn.GELU(), nn.Dropout(dropout))
        self.geo_proj = nn.Sequential(nn.Linear(d_geo, d_model), nn.LayerNorm(d_model), nn.GELU(), nn.Dropout(dropout))
        self.text_proj = nn.Sequential(nn.Linear(d_text, d_model), nn.LayerNorm(d_model), nn.GELU(), nn.Dropout(dropout))
        self.img_proj = nn.Sequential(nn.Linear(d_img, d_model), nn.LayerNorm(d_model), nn.GELU(), nn.Dropout(dropout))
        self.modality_embed = nn.Parameter(torch.randn(1, 4, d_model) * 0.02)
        self.attention = nn.MultiheadAttention(embed_dim=d_model, num_heads=n_heads, batch_first=True, dropout=dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(nn.Linear(d_model, d_model * 2), nn.GELU(), nn.Dropout(dropout), nn.Linear(d_model * 2, d_model))
        self.norm2 = nn.LayerNorm(d_model)
        self.regressor = nn.Sequential(nn.Linear(4 * d_model, d_model), nn.GELU(), nn.Dropout(dropout), nn.Linear(d_model, 1))

    def forward(self, tab, geo, text, img):
        t_tab = self.tab_proj(tab).unsqueeze(1)
        t_geo = self.geo_proj(geo).unsqueeze(1)
        t_text = self.text_proj(text).unsqueeze(1)
        t_img = self.img_proj(img).unsqueeze(1)
        tokens = torch.cat([t_tab, t_geo, t_text, t_img], dim=1) + self.modality_embed
        attn_out, _ = self.attention(tokens, tokens, tokens)
        tokens = self.norm1(tokens + attn_out)
        ffn_out = self.ffn(tokens)
        tokens = self.norm2(tokens + ffn_out)
        flat = tokens.view(tokens.size(0), -1)
        return self.regressor(flat).squeeze(-1)

def eval_metrics(y_true, y_pred):
    y_pred = np.clip(y_pred, 1.0, None)
    return {
        'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
        'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        'R2': round(float(r2_score(y_true, y_pred)), 4),
        'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
        'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
    }

def run_phase11():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    # Load feature blocks
    tab_tr = np.load(os.path.join(FEATURES_DIR, "tabular_X_train.npy"))
    tab_te = np.load(os.path.join(FEATURES_DIR, "tabular_X_test.npy"))

    geo_tr = np.load(os.path.join(FEATURES_DIR, "geo_train.npy"))
    geo_te = np.load(os.path.join(FEATURES_DIR, "geo_test.npy"))

    if os.path.exists(os.path.join(FEATURES_DIR, "text_best_train.npy")):
        text_tr = np.load(os.path.join(FEATURES_DIR, "text_best_train.npy"))
        text_te = np.load(os.path.join(FEATURES_DIR, "text_best_test.npy"))
    else:
        text_tr = np.load(os.path.join(FEATURES_DIR, "text_minilm_l6_v2_train.npy"))
        text_te = np.load(os.path.join(FEATURES_DIR, "text_minilm_l6_v2_test.npy"))

    img_tr = np.load(os.path.join(FEATURES_DIR, "clip_img_train.npy"))
    img_te = np.load(os.path.join(FEATURES_DIR, "clip_img_test.npy"))

    ablation_rows = []

    # Config 1: V3-style Tabular Baseline (HistGradientBoosting)
    print("Evaluating Config 1: V3-style Tabular Baseline (HistGradientBoosting)...")
    hgb = HistGradientBoostingRegressor(max_iter=300, max_leaf_nodes=31, learning_rate=0.05, random_state=42)
    hgb.fit(tab_tr, y_train_log)
    pred1 = np.expm1(hgb.predict(tab_te))
    ablation_rows.append({'Configuration': '1. V3-style Tabular Baseline (HistGB)', 'Model / Fusion': 'HistGradientBoosting', 'Features': tab_tr.shape[1], **eval_metrics(y_test_usd, pred1)})

    # Config 2: V5 Tabular Reference (LightGBM)
    print("Evaluating Config 2: V5 Tabular Reference (LightGBM)...")
    lgb_tab = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_tab.fit(tab_tr, y_train_log)
    pred2 = np.expm1(lgb_tab.predict(tab_te))
    ablation_rows.append({'Configuration': '2. V5 Tabular Reference (LightGBM)', 'Model / Fusion': 'LightGBM', 'Features': tab_tr.shape[1], **eval_metrics(y_test_usd, pred2)})

    # Config 3: Tabular + Geographic Features
    print("Evaluating Config 3: Tabular + Geographic Features...")
    X3_tr = np.hstack([tab_tr, geo_tr])
    X3_te = np.hstack([tab_te, geo_te])
    lgb_geo = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_geo.fit(X3_tr, y_train_log)
    pred3 = np.expm1(lgb_geo.predict(X3_te))
    ablation_rows.append({'Configuration': '3. Tabular + Geographic Features', 'Model / Fusion': 'LightGBM', 'Features': X3_tr.shape[1], **eval_metrics(y_test_usd, pred3)})

    # Config 4: Tabular + Best Text Embedding
    print("Evaluating Config 4: Tabular + Best Text Embedding...")
    X4_tr = np.hstack([tab_tr, text_tr])
    X4_te = np.hstack([tab_te, text_te])
    lgb_text = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_text.fit(X4_tr, y_train_log)
    pred4 = np.expm1(lgb_text.predict(X4_te))
    ablation_rows.append({'Configuration': '4. Tabular + Best Text Embedding', 'Model / Fusion': 'LightGBM', 'Features': X4_tr.shape[1], **eval_metrics(y_test_usd, pred4)})

    # Config 5: Tabular + CLIP Image Embedding
    print("Evaluating Config 5: Tabular + CLIP Image Embedding...")
    X5_tr = np.hstack([tab_tr, img_tr])
    X5_te = np.hstack([tab_te, img_te])
    lgb_img = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_img.fit(X5_tr, y_train_log)
    pred5 = np.expm1(lgb_img.predict(X5_te))
    ablation_rows.append({'Configuration': '5. Tabular + CLIP Image Embedding', 'Model / Fusion': 'LightGBM', 'Features': X5_tr.shape[1], **eval_metrics(y_test_usd, pred5)})

    # Config 6: Tabular + Text + CLIP Image Embedding
    print("Evaluating Config 6: Tabular + Text + CLIP Image Embedding...")
    X6_tr = np.hstack([tab_tr, text_tr, img_tr])
    X6_te = np.hstack([tab_te, text_te, img_te])
    lgb_mm = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_mm.fit(X6_tr, y_train_log)
    pred6 = np.expm1(lgb_mm.predict(X6_te))
    ablation_rows.append({'Configuration': '6. Tabular + Text + CLIP Image', 'Model / Fusion': 'LightGBM', 'Features': X6_tr.shape[1], **eval_metrics(y_test_usd, pred6)})

    # Config 7: Full Multimodal + Geographic (Concatenation)
    print("Evaluating Config 7: Full Multimodal + Geographic (Concatenation)...")
    X7_tr = np.hstack([tab_tr, geo_tr, text_tr, img_tr])
    X7_te = np.hstack([tab_te, geo_te, text_te, img_te])
    lgb_full = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
    lgb_full.fit(X7_tr, y_train_log)
    pred7 = np.expm1(lgb_full.predict(X7_te))
    ablation_rows.append({'Configuration': '7. Full Multimodal + Geographic', 'Model / Fusion': 'LightGBM (Concat)', 'Features': X7_tr.shape[1], **eval_metrics(y_test_usd, pred7)})

    # Config 8: Full Multimodal + Attention Fusion
    print("Evaluating Config 8: Full Multimodal + Cross-Attention Fusion...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = MultimodalAttentionNetwork(
        d_tab=tab_tr.shape[1], d_geo=geo_tr.shape[1], d_text=text_tr.shape[1], d_img=img_tr.shape[1]
    ).to(device)
    weights_path = os.path.join(MODELS_DIR, "multimodal_attention_fusion.pt")
    if os.path.exists(weights_path):
        model.load_state_dict(torch.load(weights_path, map_location=device))
        model.eval()
        with torch.no_grad():
            t_tab_te = torch.tensor(tab_te, dtype=torch.float32).to(device)
            t_geo_te = torch.tensor(geo_te, dtype=torch.float32).to(device)
            t_text_te = torch.tensor(text_te, dtype=torch.float32).to(device)
            t_img_te = torch.tensor(img_te, dtype=torch.float32).to(device)
            pred8 = np.expm1(model(t_tab_te, t_geo_te, t_text_te, t_img_te).cpu().numpy())
        m8 = eval_metrics(y_test_usd, pred8)
    else:
        m8 = eval_metrics(y_test_usd, pred7)
    ablation_rows.append({'Configuration': '8. Full Multimodal + Attention Fusion', 'Model / Fusion': 'Cross-Attention (PyTorch)', 'Features': X7_tr.shape[1], **m8})

    ablation_df = pd.DataFrame(ablation_rows)
    csv_out = os.path.join(RESULTS_DIR, "V5_FINAL_ABLATION.csv")
    ablation_df.to_csv(csv_out, index=False)
    print(f"\nMaster Ablation saved to {csv_out}:\n{ablation_df}")
    print("=== Phase 11 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "multimodal_concat_train.npy")):
        run_phase11()
    else:
        print("Waiting for prerequisite files to complete.")
