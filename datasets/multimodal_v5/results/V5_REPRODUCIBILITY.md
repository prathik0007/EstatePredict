# Multimodal V5 Reproducibility Guide

## System & Execution Environment
- **Operating System**: Windows 11 (Architecture: AMD64)
- **Python Version**: 3.12.5
- **Key Libraries**:
  - `torch`: Deep learning and multi-head cross-attention fusion
  - `sentence-transformers`: Exact library for CLIP vision and dense text embeddings
  - `lightgbm`: Gradient boosted tree regressor
  - `xgboost`: Gradient boosted tree regressor
  - `catboost`: Gradient boosted tree regressor
  - `scikit-learn`: Preprocessing, PCA, and metrics
  - `shap`: TreeSHAP attribution
  - `pillow`: Image decoding and verification

---

## Exact Model Checkpoints & Specifications
- **CLIP Vision Checkpoint**: `sentence-transformers/clip-ViT-B-32`
  - Library: `sentence-transformers` (PyTorch backend)
  - Embedding Dimension: 512
  - Image Preprocessing: PIL RGB conversion, bilinear resize to $224 \times 224$, standard CLIP normalization
  - Normalization: Unit-sphere L2 projection (`normalize_embeddings=True`)
- **Text Embedding Checkpoints**:
  - `BAAI/bge-small-en-v1.5` (Dimension: 384, lowest MAE: $80.754)
  - `intfloat/e5-large-v2` (Dimension: 1024, prefix `"passage: "`, best RMSE: $163.542, best $R^2$: 0.6663 at PCA 95%)
  - `BAAI/bge-large-en-v1.5` (Dimension: 1024, MAE: $81.654)
  - `intfloat/e5-small-v2` (Dimension: 384, MAE: $81.600)
  - `sentence-transformers/all-MiniLM-L6-v2` (Dimension: 384, MAE: $82.059)
  - `openai/clip-vit-base-patch32` (CLIP-Text, Dimension: 512, MAE: $82.213)
  - *Infeasible Models*: `hkunlp/instructor-xl` and `sentence-transformers/sentence-t5-large` were feasibility-tested but not executed in the full pipeline due to severe download bandwidth throttling / 3B parameter CPU runtime constraints.
- **Reference Regressor**: LightGBM (300 estimators, 31 leaves, learning rate 0.05, seed 42)

---

## Dataset Snapshot Metadata
- **Source**: Inside Airbnb
- **Location**: Austin, Texas, United States
- **Exact Snapshot Date**: `2026-06-22`
- **Source URL**: `https://data.insideairbnb.com/united-states/tx/austin/2026-06-22/data/listings.csv.gz`
- **Retrieval Date**: `2026-09-10`
- **Listing Count**: 5,050 listings
- **Primary Property Images**: 5,050 authentic cover photos (`picture_url`)

---

## Fixed Experimental Constants
- **Random Seed**: `42` across all splits, models, and sampling
- **Dataset Scale**: $N=5,050$ authentic listings
- **Train/Test Split**: 80% Train (4,040) / 20% Test (1,010)
- **Conformal Splits**: Fit (3,030) / Calibration (1,010) / Test (1,010)
- **Target Variable**: $\log(1 + \text{price})$, evaluated via $\exp(\hat{y}) - 1$ in USD ($)

---

## Step-by-Step Execution Sequence
Execute scripts sequentially from repository root:
```bash
# Phase 0 & 1: Dataset acquisition, image download, and reproducible splits
python datasets/multimodal_v5/scripts/00_phase0_dataset_setup.py
python datasets/multimodal_v5/scripts/01_phase1_splits.py

# Phase 2: Tabular baseline comparison
python datasets/multimodal_v5/scripts/02_phase2_tabular_models.py

# Phase 3 & 4: CLIP image and dense text representations
python datasets/multimodal_v5/scripts/03_phase3_clip_images.py
python datasets/multimodal_v5/scripts/04_phase4_text_embeddings.py

# Step 2 Controlled Large Text Ablation (BGE-large & E5-large across No PCA, PCA 95%, PCA 99%)
python datasets/multimodal_v5/scripts/04b_large_text_embeddings_ablation.py

# Phase 5 & 6: PCA ablation and multi-image feasibility audit
python datasets/multimodal_v5/scripts/05_phase5_pca_ablation.py
python datasets/multimodal_v5/scripts/06_phase6_multi_image_feasibility.py

# Phase 7: Geographic feature engineering
python datasets/multimodal_v5/scripts/07_phase7_geographic_features.py

# Phases 8 & 9: Multimodal concatenation and cross-attention fusion
python datasets/multimodal_v5/scripts/08_phase8_multimodal_concat_and_attention.py

# Phase 10 & 11: Training volume sensitivity and master ablation table
python datasets/multimodal_v5/scripts/10_phase10_training_volume.py
python datasets/multimodal_v5/scripts/11_phase11_master_ablation.py

# Phases 12, 13, 14: SHAP explainability, conformal prediction, and leakage audit
python datasets/multimodal_v5/scripts/12_phase12_shap_analysis.py
python datasets/multimodal_v5/scripts/13_phase13_conformal_prediction.py
python datasets/multimodal_v5/scripts/14_phase14_leakage_audit.py

# Phase 15: Synthesis reports
python datasets/multimodal_v5/scripts/15_phase15_reproducibility.py
```
