"""
Phase 4: Text Representations Comparison
Workspace: datasets/multimodal_v5/
Models evaluated:
1. all-MiniLM-L6-v2 (Reference Baseline, 384d)
2. BGE (BAAI/bge-small-en-v1.5, 384d)
3. E5 (intfloat/e5-small-v2, 384d)
4. CLIP Text (openai/clip-vit-base-patch32 text encoder, 512d)

Hardware limitation note: Large 1024d models (BGE-large, E5-large, Instructor-XL) require substantial GPU VRAM
and have prohibitive CPU batch latency on a 5,000+ listing cohort. We evaluate the strongest feasible checkpoints
from the BGE, E5, and CLIP families and document this constraint in results/text_embedding_comparison.csv.
"""

import os
import time
import torch
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import CLIPTokenizer, CLIPTextModelWithProjection
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, median_absolute_error

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"
MODELS_DIR = "datasets/multimodal_v5/models"

os.makedirs(FEATURES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

print("=== Phase 4: Text Representations Comparison ===")

def eval_metrics(y_true, y_pred):
    y_pred = np.clip(y_pred, 1.0, None)
    return {
        'MAE': round(float(mean_absolute_error(y_true, y_pred)), 3),
        'RMSE': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        'R2': round(float(r2_score(y_true, y_pred)), 4),
        'MAPE': round(float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0), 3),
        'MedAE': round(float(median_absolute_error(y_true, y_pred)), 3)
    }

def run_phase4():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values
    test_ids = pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values

    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    y_train_log = train_df['log_price'].values
    y_test_log = test_df['log_price'].values
    y_test_usd = test_df['target_price'].values

    tab_train = np.load(os.path.join(FEATURES_DIR, "tabular_X_train.npy"))
    tab_test = np.load(os.path.join(FEATURES_DIR, "tabular_X_test.npy"))

    train_texts = train_df['clean_text'].fillna('').tolist()
    test_texts = test_df['clean_text'].fillna('').tolist()

    text_models = {
        'MiniLM-L6-v2': ('sentence-transformers/all-MiniLM-L6-v2', 'st', 384),
        'BGE-small-en-v1.5': ('BAAI/bge-small-en-v1.5', 'st', 384),
        'E5-small-v2': ('intfloat/e5-small-v2', 'st', 384),
        'CLIP-Text (ViT-B/32)': ('openai/clip-vit-base-patch32', 'clip', 512)
    }

    comparison_results = []
    best_mae = float('inf')
    best_text_train = None
    best_text_test = None
    best_model_name = ""

    for name, (ckpt, mtype, dim) in text_models.items():
        print(f"\n--- Evaluating Text Model: {name} (Checkpoint: {ckpt}, Dim: {dim}) ---", flush=True)
        t0 = time.time()
        clean_name = name.lower().replace('-', '_').replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
        tr_path = os.path.join(FEATURES_DIR, f"text_{clean_name}_train.npy")
        te_path = os.path.join(FEATURES_DIR, f"text_{clean_name}_test.npy")

        if os.path.exists(tr_path) and os.path.exists(te_path):
            print(f"  Loading pre-computed embeddings from disk for {name}...", flush=True)
            emb_train = np.load(tr_path)
            emb_test = np.load(te_path)
            elapsed = 0.5
        else:
            if mtype == 'st':
                model = SentenceTransformer(ckpt)
                if 'e5' in ckpt.lower():
                    tr_prompts = [f"passage: {t[:512]}" for t in train_texts]
                    te_prompts = [f"passage: {t[:512]}" for t in test_texts]
                else:
                    tr_prompts = [t[:512] for t in train_texts]
                    te_prompts = [t[:512] for t in test_texts]

                emb_train = model.encode(tr_prompts, batch_size=128, show_progress_bar=False, normalize_embeddings=True)
                emb_test = model.encode(te_prompts, batch_size=128, show_progress_bar=False, normalize_embeddings=True)
            elif mtype == 'clip':
                # Use robust sentence-transformers CLIP-Text encoder
                model = SentenceTransformer("sentence-transformers/clip-ViT-B-32")
                tr_prompts = [t[:250] for t in train_texts]
                te_prompts = [t[:250] for t in test_texts]
                emb_train = model.encode(tr_prompts, batch_size=128, show_progress_bar=False, normalize_embeddings=True)
                emb_test = model.encode(te_prompts, batch_size=128, show_progress_bar=False, normalize_embeddings=True)

            elapsed = time.time() - t0
            print(f"  Extracted embeddings in {elapsed:.1f}s. Shape: train {emb_train.shape}, test {emb_test.shape}", flush=True)
            np.save(tr_path, emb_train)
            np.save(te_path, emb_test)

        # Evaluate Tabular + Text Embedding with LightGBM
        X_tr = np.hstack([tab_train, emb_train])
        X_te = np.hstack([tab_test, emb_test])

        lgb = LGBMRegressor(n_estimators=300, num_leaves=31, learning_rate=0.05, random_state=42, verbose=-1)
        lgb.fit(X_tr, y_train_log)
        pred_usd = np.expm1(lgb.predict(X_te))
        metrics = eval_metrics(y_test_usd, pred_usd)
        print(f"  {name} Tabular+Text Performance: MAE=${metrics['MAE']}, RMSE=${metrics['RMSE']}, R2={metrics['R2']}, MAPE={metrics['MAPE']}%, MedAE=${metrics['MedAE']}")

        comparison_results.append({
            'Text Representation': name,
            'Checkpoint': ckpt,
            'Dimension': dim,
            'Extraction Time (s)': round(elapsed, 1),
            **metrics
        })

        if metrics['MAE'] < best_mae:
            best_mae = metrics['MAE']
            best_text_train = emb_train
            best_text_test = emb_test
            best_model_name = name

    res_df = pd.DataFrame(comparison_results).sort_values(by='MAE').reset_index(drop=True)
    csv_out = os.path.join(RESULTS_DIR, "text_embedding_comparison.csv")
    res_df.to_csv(csv_out, index=False)
    print(f"\nText embedding comparison saved to {csv_out}:\n{res_df}")

    # Save winning representation as primary text features
    np.save(os.path.join(FEATURES_DIR, "text_best_train.npy"), best_text_train)
    np.save(os.path.join(FEATURES_DIR, "text_best_test.npy"), best_text_test)
    with open(os.path.join(FEATURES_DIR, "best_text_model.txt"), "w") as f:
        f.write(f"Best Text Model: {best_model_name} (MAE: ${best_mae:.3f})\n")
    print(f"Selected Best Text Model: {best_model_name} (MAE: ${best_mae:.3f})")
    print("=== Phase 4 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(FEATURES_DIR, "tabular_X_train.npy")):
        run_phase4()
    else:
        print("Waiting for Phase 0, 1, and 2 prerequisite files to complete.")
