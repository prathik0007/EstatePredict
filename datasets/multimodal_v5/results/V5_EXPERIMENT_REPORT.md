# Multimodal V5 Comprehensive Experiment Report

## Executive Summary
This document provides the definitive empirical findings for the **Multimodal V5 Research Pipeline**.
All experiments investigate the 8 professor-requested research enhancements on an authentic, high-density Inside Airbnb metropolitan cohort ($N=5,050$ listings) with complete multimodal isolation from prior V3/V4 versions.

---

## 1. Verified Metropolitan Cohort (Phase 0 & 1)
- **Data Source**: Inside Airbnb
- **Metropolitan Location**: Austin, Texas, United States
- **Exact Snapshot Date**: `2026-06-22`
- **Source URL**: `https://data.insideairbnb.com/united-states/tx/austin/2026-06-22/data/listings.csv.gz`
- **Retrieval / Download Date**: `2026-09-10`
- **Total Raw Listings in Snapshot**: 11,295
- **Final Valid Cohort**: **5,050 listings** (Comfortably satisfies the $\ge 5,000$ requirement)
- **Authentic Primary Property Images**: **5,050 verified 1-to-1 downloads** (`picture_url` from `a0.muscache.com`)
- **Fixed Reproducible Split**: 80% Train (4,040 listings) / 20% Held-Out Test (1,010 listings) with seed 42.
- **Conformal Partitions**: Train Fit (3,030) / Calibration (1,010) / Test (1,010).

---

## 2. Tabular Baselines Comparison (Phase 2)
Comparison of gradient boosted tree architectures on identical 71 preprocessed tabular features and the identical held-out test split ($N=1,010$):

| Model | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| XGBoost | 85.08 | 171.622 | 0.6325 | 28.857 | 36.042 |
| CatBoost | 85.525 | 174.431 | 0.6204 | 29.173 | 37.622 |
| HistGradientBoosting | 85.851 | 170.302 | 0.6381 | 29.802 | 37.995 |
| LightGBM | 87.09 | 172.958 | 0.6267 | 30.021 | 37.144 |

### Tabular Model Selection & Metric-Specific Analysis:
- **XGBoost** achieved the best **MAE (\$85.080)** and lowest **MedAE (\$36.042)**.
- **HistGradientBoosting** achieved the best **RMSE (\$170.302)** and highest **$R^2$ (0.6381)**.
- **CatBoost** achieved intermediate performance (MAE \$85.525, RMSE \$174.431, $R^2$ 0.6204).
- **LightGBM** exhibited the weakest pure-tabular performance among the four architectures on MAE (\$87.090) and $R^2$ (0.6267).
- **Designation**: LightGBM is designated as the **"V5 Tabular Reference (LightGBM)"** and serves intentionally as the controlled baseline regressor for subsequent geographic and multimodal ablation comparisons to maintain uniform tree hyperparameters, split rules, and scalability across high-dimensional feature spaces.

---

## 3. CLIP Image Representation Specification (Phase 3)
- **Exact Model Checkpoint**: `sentence-transformers/clip-ViT-B-32`
- **Library**: `sentence-transformers` (PyTorch backend)
- **Visual Embedding Dimension**: 512
- **Image Preprocessing**:
  - Image loading in RGB format via PIL
  - Bilinear interpolation resize to $224 \times 224$ pixels
  - Standard CLIP image normalization (Mean = [0.48145466, 0.4578275, 0.40821073], Std = [0.26862954, 0.26130258, 0.27577711])
- **Normalization**: Unit-sphere L2 normalization (`normalize_embeddings=True`)
- **PCA Status**: Preserved as full 512-dimensional representations for multimodal modeling.

---

## 4. Text Representation Comparison & Large Model Ablation (Phase 4 & Step 2)
Controlled empirical ablation comparing lightweight semantic encoders against high-capacity 1024-dimensional dense text representations on identical property descriptions concatenated with 71 tabular features in LightGBM ($N=1,010$ held-out test listings):

| Model | Checkpoint | Configuration | Raw Dimension | PCA Dimension | Explained Variance (%) | Total Downstream Features | Extraction Time (s) | Downstream Time (s) | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BGE-large-en-v1.5 | BAAI/bge-large-en-v1.5 | No PCA | 1024 | 1024.0 | 100.0 | 1095.0 | 4722.9 | 32.5 | 81.654 | 168.032 | 0.6477 | 28.345 | 36.11 |
| BGE-large-en-v1.5 | BAAI/bge-large-en-v1.5 | PCA 95% variance | 1024 | 317.0 | 95.01 | 388.0 | 4722.9 | 10.0 | 83.103 | 171.777 | 0.6318 | 29.431 | 37.561 |
| BGE-large-en-v1.5 | BAAI/bge-large-en-v1.5 | PCA 99% variance | 1024 | 539.0 | 99.01 | 610.0 | 4722.9 | 15.7 | 83.381 | 172.865 | 0.6271 | 29.297 | 35.954 |
| E5-large-v2 | intfloat/e5-large-v2 | No PCA | 1024 | 1024.0 | 100.0 | 1095.0 | 7798.5 | 22.3 | 81.043 | 166.501 | 0.6541 | 28.242 | 34.29 |
| E5-large-v2 | intfloat/e5-large-v2 | PCA 95% variance | 1024 | 393.0 | 95.02 | 464.0 | 7798.5 | 7.6 | 81.336 | 163.542 | 0.6663 | 28.398 | 36.743 |
| E5-large-v2 | intfloat/e5-large-v2 | PCA 99% variance | 1024 | 607.0 | 99.01 | 678.0 | 7798.5 | 12.5 | 83.321 | 170.269 | 0.6383 | 29.211 | 37.219 |
| BGE-small-en-v1.5 | BAAI/bge-small-en-v1.5 | No PCA | 384 | 384.0 | 100.0 | 455.0 | 0.5 | 1.2 | 80.754 | 167.298 | 0.6508 | 28.157 | 36.266 |
| E5-small-v2 | intfloat/e5-small-v2 | No PCA | 384 | 384.0 | 100.0 | 455.0 | 0.5 | 1.2 | 81.6 | 168.249 | 0.6468 | 28.416 | 34.834 |
| all-MiniLM-L6-v2 | sentence-transformers/all-MiniLM-L6-v2 | No PCA | 384 | 384.0 | 100.0 | 455.0 | 0.5 | 1.1 | 82.059 | 173.28 | 0.6253 | 28.461 | 34.513 |
| CLIP-Text (ViT-B/32) | openai/clip-vit-base-patch32 | No PCA | 512 | 512.0 | 100.0 | 583.0 | 313.6 | 1.5 | 82.213 | 165.185 | 0.6595 | 28.822 | 37.277 |
| Instructor-XL | hkunlp/instructor-xl | NOT EXECUTED | 768 | nan | nan | nan | nan | nan | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED |
| Sentence-T5-large | sentence-transformers/sentence-t5-large | NOT EXECUTED | 768 | nan | nan | nan | nan | nan | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED |

### Key Findings on Text Embeddings & Metric Trade-Offs:
1. **Lowest MAE & MAPE**:
   - **`BAAI/bge-small-en-v1.5` (No PCA, 384d)** achieved the lowest mean absolute error (**MAE = \$80.754**, MAPE = 28.157%) across all evaluated models.
2. **Best RMSE & $R^2$**:
   - **`intfloat/e5-large-v2` + PCA 95% variance (393d)** achieved the highest explained variance (**$R^2$ = 0.6663**) and lowest quadratic loss (**RMSE = \$163.542**), outperforming BGE-small ($R^2$ 0.6508, RMSE \$167.298) and CLIP-Text ($R^2$ 0.6595, RMSE \$165.185).
3. **Lowest Median Absolute Error (MedAE)**:
   - **`intfloat/e5-large-v2` (No PCA, 1024d)** achieved the lowest median error (**MedAE = \$34.290**).
4. **Feasibility Testing for Instructor-XL and Sentence-T5-large**:
   - **`hkunlp/instructor-xl`**: Feasibility-tested but **not executed** in the full pipeline. The ~4.96 GB model binary experienced severe download bandwidth throttling on unauthenticated HuggingFace requests (0.1 MB after 2.5 min; >33 hours estimated transfer). In addition, CPU forward-pass latency for 3B parameters (~10–15s per text) renders 5,050 listings computationally prohibitive (>14–20 hours inference).
   - **`sentence-transformers/sentence-t5-large`**: Feasibility-tested but **not executed** in the full pipeline. Unauthenticated HuggingFace download stalled (>30 minutes latency) exceeding interactive execution limits; halted per user direction. Zero numerical values were fabricated.

---

## 5. PCA Dimensionality Reduction Ablation (Phase 5)
Evaluation of PCA configurations fit strictly ONLY on the training fold:

| Configuration | Original Dimensions | Reduced Dimensions | Explained Variance (%) | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Aggressive PCA (32 dims, historical V3 reference) | 512 | 32 | 69.88 | 80.12 | 162.569 | 0.6702 | 28.114 | 35.811 |
| PCA retaining 95% variance | 512 | 206 | 95.0 | 81.994 | 166.82 | 0.6528 | 28.835 | 37.012 |
| No PCA (Full Raw Embeddings) | 512 | 512 | 100.0 | 82.366 | 164.725 | 0.6614 | 29.474 | 38.04 |
| PCA retaining 99% variance | 512 | 364 | 99.0 | 83.739 | 170.133 | 0.6388 | 29.395 | 38.306 |

### Findings on PCA Variance:
- **Aggressive PCA (32 dimensions, 69.88% variance retained)** produced the lowest test MAE (**\$80.120**) and highest $R^2$ (**0.6702**) for CLIP visual embeddings.
- Retaining 95% variance (206 dimensions) yielded MAE \$81.994 ($R^2$ 0.6528).
- Retaining 100% variance (No PCA, 512 dimensions) yielded MAE \$82.366 ($R^2$ 0.6614).
- Retaining 99% variance (364 dimensions) yielded MAE \$83.739 ($R^2$ 0.6388).

---

## 6. Multiple Image Feasibility Audit & Limitation (Phase 6)
- **Mandatory Scientific Statement**:
  > *"Multi-image aggregation was not performed because the selected public dataset does not provide multiple authentic property images reliably linked to each listing."*
- **Quantitative Audit**:
  - Total cohort listings: **5,050**
  - Authentic primary property images: **5,050** (1 image per listing from `picture_url` on `a0.muscache.com`)
  - Listings with $\ge 2$ authentic property images in the public dump: **0** (0.0%)
  - Listings with $\ge 5$ authentic property images in the public dump: **0** (0.0%)
- **Protocol Status**: Step 5 was **not implemented** as an empirical pipeline feature due to public dataset schema limitations, and is formally documented as a dataset limitation.

---

## 7. Controlled Geographic Feature Comparison (Phase 7)
Evaluation of target-independent Haversine distance features to 8 Austin municipal landmarks:

| Configuration | Features | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tabular Baseline (LightGBM) | 71 | 87.09 | 172.958 | 0.6267 | 30.021 | 37.144 |
| Tabular + Geographic Features | 91 | 80.778 | 158.951 | 0.6847 | 28.0 | 36.02 |

### Measured Controlled Improvement:
- **Controlled Comparison**: V5 Tabular Reference (LightGBM, 71 features) $\to$ LightGBM + Geographic Features (91 features).
- **Measured Improvement**:
  - **MAE**: \$87.090 $\to$ **\$80.778** (Reduction of **-\$6.312**)
  - **$R^2$**: 0.6267 $\to$ **0.6847** (Gain of **+0.0580**)
  - **RMSE**: \$172.958 $\to$ **\$158.951** (Reduction of **-\$14.007**)

---

## 8. Multimodal Fusion: Concatenation vs. Cross-Attention (Phases 8 & 9)
Comparison of full multimodal concatenation against learned multi-head cross-attention on identical 987-dimensional feature space (71 Tabular + 20 Geo + 384 BGE Text + 512 CLIP Image):

| Architecture | Total Features / Params | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Multimodal Concatenation (LightGBM) | 987 | 77.742 | 159.105 | 0.6841 | 27.728 | 34.261 |
| Multimodal Cross-Attention Fusion (PyTorch) | 326657 | 79.033 | 152.095 | 0.7114 | 30.261 | 40.601 |

### Comparative Architecture Interpretation:
- **Attention Fusion** achieved the best **$R^2$ (0.7114)** and lowest **RMSE (\$152.095)**.
- **LightGBM Concatenation** achieved better **MAE (\$77.742)**, lower **MAPE (27.728%)**, and lower **MedAE (\$34.261)**.
- **Scientific Conclusion**: Neither model is universally superior. Deep cross-attention demonstrates stronger global variance explanation and penalizes large outlier errors more effectively, whereas gradient boosted tree concatenation provides tighter median accuracy and lower mean absolute dollar errors on the rental distribution.

---

## 9. Training Volume Sensitivity Analysis (Phase 10)
Sensitivity behavior across increasing training subsets on the identical held-out test set ($N=1,010$):

| Training Size (N) | Percentage of Train Set (%) | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1000.0 | 24.8 | 90.083 | 186.119 | 0.5678 | 31.675 | 38.684 |
| 2000.0 | 49.5 | 84.552 | 169.503 | 0.6415 | 30.735 | 39.698 |
| 3000.0 | 74.3 | 81.602 | 165.293 | 0.6591 | 28.674 | 36.467 |
| 4040.0 | 100.0 | 77.742 | 159.105 | 0.6841 | 27.728 | 34.261 |

### Protocol Classification:
This experiment is preserved strictly as a **"Training Volume Sensitivity Analysis"**, demonstrating monotonic empirical error reduction as sample scale increases from $N=1,000$ to $N=4,040$, rather than asserting a formal parametric scaling law.

---

## 10. Master Controlled Final Ablation (Phase 11)
Master evaluation across all 8 canonical experimental configurations on identical held-out test set ($N=1,010$):

| Configuration | Model / Fusion | Features | MAE | RMSE | R2 | MAPE | MedAE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1. V3-style Tabular Baseline (HistGB) | HistGradientBoosting | 71 | 85.851 | 170.302 | 0.6381 | 29.802 | 37.995 |
| 2. V5 Tabular Reference (LightGBM) | LightGBM | 71 | 87.09 | 172.958 | 0.6267 | 30.021 | 37.144 |
| 3. Tabular + Geographic Features | LightGBM | 91 | 80.778 | 158.951 | 0.6847 | 28.0 | 36.02 |
| 4. Tabular + Best Text Embedding | LightGBM | 455 | 80.754 | 167.298 | 0.6508 | 28.157 | 36.266 |
| 5. Tabular + CLIP Image Embedding | LightGBM | 583 | 82.366 | 164.725 | 0.6614 | 29.474 | 38.04 |
| 6. Tabular + Text + CLIP Image | LightGBM | 967 | 80.941 | 167.079 | 0.6517 | 28.593 | 35.524 |
| 7. Full Multimodal + Geographic | LightGBM (Concat) | 987 | 77.742 | 159.105 | 0.6841 | 27.728 | 34.261 |
| 8. Full Multimodal + Attention Fusion | Cross-Attention (PyTorch) | 987 | 79.033 | 152.095 | 0.7114 | 30.261 | 40.601 |

---

## 11. SHAP Interpretability & Conformal Uncertainty (Phases 12 & 13)

### SHAP Explainability:
- Metrics reflect **relative mean absolute SHAP importance** within the tree ensemble predictor.
- SHAP attributions reflect associational feature importance and **do not make causal claims**.
- Top 5 influential features:
  1. `minimum_nights_num` (19.65%)
  2. `accommodates_num` (18.04%)
  3. `number_of_reviews_num` (7.19%)
  4. `bathrooms_num` (7.16%)
  5. `bedrooms_num` (5.65%)

### Distribution-Free Conformal Prediction:
Evaluated on 3 strictly disjoint sets (Train Fit: 3,030 / Calibration: 1,010 / Held-Out Test: 1,010):

| Nominal Coverage (%) | Empirical Coverage (%) | Quantile Q | Mean Interval Width ($) | Median Interval Width ($) |
| :--- | :--- | :--- | :--- | :--- |
| 80.0 | 79.8 | 0.4125 | 220.91 | 174.92 |
| 90.0 | 91.19 | 0.6113 | 338.46 | 267.99 |
| 95.0 | 96.63 | 0.8435 | 493.1 | 390.43 |

- **Observed Empirical Coverage**: At nominal 95% confidence, the observed empirical test coverage is **96.63%** (with mean interval width **\$493.10** and median interval width **\$390.43**).
- **Precision of Terminology**: The 96.63% figure is reported strictly as **observed empirical coverage** on the test partition, not as a theoretical or universal guarantee.
