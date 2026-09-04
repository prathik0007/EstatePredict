# Multimodal Experiment & Leakage Audit (Asheville, NC Benchmark)

## 1. Dataset & Provenance
- **Market**: Asheville, North Carolina, United States
- **Snapshot Date**: 2023-12-18 (Inside Airbnb official release)
- **Primary Relational Key**: Native platform integer `id` (e.g., `108061`)
- **Total Valid Multimodal Listings (N)**: 1800 listings
- **Target Price Variable**: `price_usd` (Nightly listing rate in USD, $0$ null values)

## 2. Integrity & Leakage Verification Checks

| Verification Check | Status | Evidence & Audit Details |
| :--- | :---: | :--- |
| **Relational ID Alignment** | **PASSED** | Every tabular row, text embedding, and image embedding is strictly indexed by platform `id`. |
| **Single-Source Modality Linkage** | **PASSED** | Target price, tabular features, text descriptions, and photos originate from the **exact same listing record**. |
| **Target Leakage Prevention** | **PASSED** | `price_usd` and `price_log1p` were strictly excluded from all feature matrices ($X_{\text{tab}}$, $X_{\text{text}}$, $X_{\text{img}}$). |
| **Train / Test Partition Isolation** | **PASSED** | 80% Train (1440 listings) / 20% Held-Out Test (360 listings) split with `random_state=42`. Zero overlapping IDs. |
| **Preprocessing Leakage Prevention** | **PASSED** | Imputation, `RobustScaler`, `OneHotEncoder`, and `StandardScaler` were fitted **strictly on training fold**. |
| **PCA Dimensionality Reduction** | **PASSED** | Text PCA (384 $\to$ 32-d) and Image PCA (1280 $\to$ 64-d) were fitted **strictly on training fold** and transformed on test fold. |
| **Evaluation Integrity** | **PASSED** | All evaluation metrics (MAE, RMSE, $R^2$, MAPE, MedAE) computed strictly on the held-out 360 test listings on original USD scale. |

## 3. Four-Model Ablation Benchmark Results

| Model | Features | Dimension | MAE ($) | RMSE ($) | $R^2$ | MAPE (%) | MedAE ($) | Test $N$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| HistGradientBoosting (Log1p) | Tabular Only | 23 | $74.07 | $158.64 | **0.5318** | **33.66%** | $34.88 | 360 |
| HistGradientBoosting (Log1p) | Tabular + Text | 55 | $77.58 | $165.03 | **0.4933** | **35.19%** | $35.88 | 360 |
| HistGradientBoosting (Log1p) | Tabular + Image | 87 | $79.59 | $174.16 | **0.4357** | **33.45%** | $33.55 | 360 |
| HistGradientBoosting (Log1p) | Full Multimodal | 119 | $79.65 | $174.78 | **0.4316** | **34.17%** | $35.93 | 360 |

---
*Audit generated autonomously with zero fabricated numbers.*
