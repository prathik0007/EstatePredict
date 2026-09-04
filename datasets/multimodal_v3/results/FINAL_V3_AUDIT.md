# Final Scientific & Methodological Audit: Multimodal V3 Benchmark

**Audit Execution Date**: 2026-09-04  
**Auditor**: Autonomous Verification Engine (Antigravity IDE)  
**Target Benchmark**: Multimodal V3 Real Estate Pipeline (Asheville, NC Inside Airbnb Snapshot)  
**Audit Scope**: Dataset Integrity, Relational Alignment, Leakage Prevention, Ablation Benchmark, SHAP Interpretability, Conformal Prediction, Split Consistency, Paper Claims, and Scientific Reproducibility.

---

## 1. Dataset Integrity Audit

| Verification Item | Specification / Requirement | Audit Observation | Status |
| :--- | :--- | :--- | :---: |
| **Total Cohort Size ($N$)** | Exactly 1,800 listings | `multimodal_cohort.csv` contains exactly **1,800 rows** | **PASSED** |
| **Primary Relational Key** | Platform-native 64-bit integer `id` | `id` present across all 1,800 rows (e.g. `108061`) | **PASSED** |
| **Target Variable (`price_usd`)** | Non-null, strictly positive ($> 0$) | Min: **$10.00**, Median: **$131.50**, Max: **$6,000.00**; **0 nulls / 0 NaNs** | **PASSED** |
| **Tabular Modality** | 10 numerical attributes + 3 categorical | Extracted and validated across 1,800 rows | **PASSED** |
| **Text Modality** | Authentic listing description & metadata | Composite text built from name, room type, description, neighborhood, amenities | **PASSED** |
| **Visual Modality** | Primary listing photograph on disk | Exactly 1 authentic RGB photograph per listing (`images/{id}.jpg`) | **PASSED** |
| **Duplicate IDs** | Zero duplicate listings | `cohort['id'].duplicated().sum() == 0` (1,800 unique IDs) | **PASSED** |
| **Data Provenance** | Inside Airbnb official release | Sourced from official **Asheville, NC** snapshot (Date: **2023-12-18**) | **PASSED** |
| **Legacy Dataset Isolation** | Legacy datasets excluded | Legacy Albany (`listings.csv`) and Indian House Rent (`House_Rent_Dataset.csv`) are **NOT used** in V3 | **PASSED** |

---

## 2. Relational Alignment Audit

| Verification Item | Protocol | Audit Observation | Status |
| :--- | :--- | :--- | :---: |
| **Primary Relational Key** | Native platform integer `id` | Relational join key is `id` across all tables and matrices | **PASSED** |
| **Text Embedding Alignment** | Row-wise index matching | `np.array_equal(cohort['id'], text_ids['id']) == True` ($1,800 \times 384$) | **PASSED** |
| **Image Embedding Alignment** | Row-wise index matching | `np.array_equal(cohort['id'], img_ids['id']) == True` ($1,800 \times 1280$) | **PASSED** |
| **Elimination of Positional Joins** | No synthetic / positional pairing | Zero synthetic `benchmark_row_id` or cross-city indexing used | **PASSED** |
| **One-to-One Modality Mapping** | Complete multimodal quartets | Every listing ID corresponds to exactly one price, tabular row, text vector, and image vector | **PASSED** |

---

## 3. Train / Test Leakage & Preprocessing Audit

| Pipeline Component | Leakage Prevention Protocol | Implementation Verification | Status |
| :--- | :--- | :--- | :---: |
| **Data Partitioning** | Fixed seed (`random_state=42`) | 80% Train ($N=1,440$) / 20% Held-Out Test ($N=360$) | **PASSED** |
| **Target Leakage** | Target exclusion from features | `price_usd` and `price_log1p` strictly excluded from $X_{\text{tab}}$, $X_{\text{text}}$, $X_{\text{img}}$ | **PASSED** |
| **Numerical Imputation** | Median computed on training fold only | `SimpleImputer(strategy='median').fit(X_tr)` | **PASSED** |
| **Numerical Scaling** | `RobustScaler` fitted on training fold only | `scaler.fit(X_num_tr)` $\to$ `transform(X_num_te)` | **PASSED** |
| **Categorical Encoding** | `OneHotEncoder` fitted on training fold only | `cat_ohe.fit(X_cat_tr)` with `handle_unknown='ignore'` | **PASSED** |
| **Text PCA Transformation** | PCA ($384 \to 32$-d) fitted on training fold only | `pca_text.fit(text_tr_scaled)` (73.65% variance explained) | **PASSED** |
| **Image PCA Transformation** | PCA ($1280 \to 64$-d) fitted on training fold only | `pca_img.fit(img_tr_scaled)` (57.88% variance explained) | **PASSED** |
| **Evaluation Scale** | Inverse transform to original USD scale | Evaluated using $\hat{y} = \exp(\hat{y}_{\log}) - 1$ on original USD price | **PASSED** |

---

## 4. Four-Model Ablation Benchmark Audit

All four models evaluated on the **exact same 360 held-out test listings** (`random_state=42`) from `multimodal_ablation_results.csv`:

| Model | Modality Configuration | Feature Dimension | MAE ($) | RMSE ($) | $R^2$ | MAPE (%) | MedAE ($) | Test $N$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HistGradientBoosting (Log1p)** | **Tabular Only** | **23** | **$74.07** | **$158.64** | **0.5318** | **33.66%** | **$34.88** | 360 |
| **HistGradientBoosting (Log1p)** | **Tabular + Text** | **55** | **$77.58** | **$165.03** | **0.4933** | **35.19%** | **$35.88** | 360 |
| **HistGradientBoosting (Log1p)** | **Tabular + Image** | **87** | **$79.59** | **$174.16** | **0.4357** | **33.45%** | **$33.55** | 360 |
| **HistGradientBoosting (Log1p)** | **Full Multimodal** | **119** | **$79.65** | **$174.78** | **0.4316** | **34.17%** | **$35.93** | 360 |

### Scientific Verdict on Ablation:
- **Tabular Dominance**: Tabular features alone deliver the highest predictive fidelity ($R^2 = 0.5318$, $\text{MAE} = \$74.07$).
- **Curse of Dimensionality / Noise Injection**: Adding raw text ($+32$-d) or image ($+64$-d) embeddings marginally decreases out-of-sample performance ($R^2$ drops from $0.5318 \to 0.4316$). In real estate appraisal, structural tabular constraints (bedrooms, bathrooms, guest capacity, coordinates) are significantly denser pricing signals than unstructured cover photographs or descriptive adjectives.

---

## 5. SHAP Explainability Audit

| Verification Item | Requirement | Audit Observation | Status |
| :--- | :--- | :--- | :---: |
| **Target Model** | Best tabular model | `HistGradientBoostingRegressor` on tabular features predicting $\log(1 + \text{Price})$ | **PASSED** |
| **Test Data Isolation** | TreeExplainer on held-out test data | Evaluated strictly on $N = 360$ test instances | **PASSED** |
| **Top Feature 1** | Capacity metric | **`Accommodates (Guests)`**: Mean \|SHAP\| = **0.2301** (27.10% relative weight) | **PASSED** |
| **Top Feature 2** | Structural metric | **`Bathrooms`**: Mean \|SHAP\| = **0.1009** (11.89% relative weight) | **PASSED** |
| **Top Feature 3** | Geographic metric | **`Longitude`**: Mean \|SHAP\| = **0.0850** (10.01% relative weight) | **PASSED** |
| **Top Feature 4** | Booking constraint | **`Minimum Nights`**: Mean \|SHAP\| = **0.0711** (8.38% relative weight) | **PASSED** |
| **Top Feature 5** | Reputation metric | **`Overall Rating`**: Mean \|SHAP\| = **0.0574** (6.76% relative weight) | **PASSED** |
| **Artifact Generation** | CSV tables, bar plots, beeswarm, waterfalls | All saved in `datasets/multimodal_v3/results/shap/` | **PASSED** |

---

## 6. Conformal Prediction Benchmark Audit

Audit of the distribution-free uncertainty quantification experiment from `conformal_metrics_summary.csv` and `stratified_price_tier_metrics.csv`:

### A. Tripartite Partitioning Protocol
- **Training Partition (70%)**: $N = 1,260$ listings
- **Calibration Partition (15%)**: $N = 270$ listings
- **Held-Out Test Partition (15%)**: $N = 270$ listings

### B. Global Conformal Results (95% Nominal Coverage Target)
- **Empirical Test Coverage**: **93.70%** (Nominal: 95.00%, $\Delta = -1.30\%$, within finite-sample statistical tolerance)
- **Mean Interval Width**: **$342.69**
- **Median Interval Width**: **$263.50**
- **Point Prediction MAE**: **$78.84**
- **Point Prediction RMSE**: **$184.88**
- **Point Prediction $R^2$**: **0.4294**
- **Point Prediction MAPE**: **34.89%**
- **Point Prediction MedAE**: **$31.76**

### C. Stratified Coverage by Price Tiers
- **Low Price Tier ($\le \$103$)**: **94.44% Coverage** (Mean Width: $209.64, MAE: $32.88)
- **Mid Price Tier ($\$104 - \$185$)**: **100.00% Coverage** (Mean Width: $270.59, MAE: $30.32)
- **High Price Tier ($> \$185$)**: **86.67% Coverage** (Mean Width: $547.85, MAE: $173.33)

---

## 7. Split Consistency Audit

| Experiment Component | Train Partition ($N_{\text{tr}}$) | Calibration Partition ($N_{\text{cal}}$) | Test Partition ($N_{\text{te}}$) | Split Ratio |
| :--- | :---: | :---: | :---: | :---: |
| **Ablation Benchmark & SHAP** | **1,440** | — | **360** | **80% / 20%** |
| **Conformal Prediction** | **1,260** | **270** | **270** | **70% / 15% / 15%** |

### Methodological Verdict on Split Discrepancy:
- **Standard Scientific Practice**: In inductive conformal prediction, dedicating a distinct, sequestered calibration partition ($15\%$) is mandatory to guarantee finite-sample validity without overfitting or double-dipping test data.
- **Reporting Clarity**: In the research paper, authors must explicitly disclose:
  1. Section 4.1 (Ablation Benchmark & SHAP) utilizes a standard **80/20 train/test split** ($N = 1,440 / 360$).
  2. Section 4.2 (Uncertainty Quantification) utilizes an inductive **70/15/15 train/calibration/test protocol** ($N = 1,260 / 270 / 270$) to prevent calibration leakage.
- **No Conflict**: Because both experiments originate from the identical verified $1,800$ Asheville cohort with fixed `random_state=42`, this represents sound statistical methodology.

---

## 8. Paper Claim & Rhetorical Integrity Audit

To maintain the highest scientific rigor, the research paper must **AVOID** the following invalid claims and adhere to factual phrasing:

| Invalid / Flawed Claim | Why It Is Scientifically Invalid | Approved / Factual Replacement Phrasing |
| :--- | :--- | :--- |
| *"The model achieves 95% accuracy."* | Conformal coverage ($95\%$) measures the **containment rate of prediction intervals**, not point accuracy ($R^2 = 0.5318$). | *"The framework provides distribution-free 95% prediction intervals with 93.70% empirical test coverage."* |
| *"Multimodal deep learning outperforms tabular baselines."* | The empirical ablation proves that Tabular Only ($R^2 = 0.5318$) outperforms Full Multimodal ($R^2 = 0.4316$) in this market. | *"Empirical ablation reveals that core structural tabular features dominate pricing power, while naive text/image embedding fusion introduces dimensionality overhead."* |
| *"SHAP proves that guest capacity causes higher rental prices."* | SHAP values reflect **model feature attribution and associative importance**, not causal econometric proof. | *"SHAP feature attribution demonstrates that guest capacity and bathroom count exhibit the highest global importance in model pricing decisions."* |
| *"The images prove interior luxury."* | Images are primary listing cover photos (which may depict exterior facades, mountain views, living rooms, or patios). | *"The visual modality utilizes verified primary property cover photographs provided in the listing snapshot."* |
| *"Conformal prediction guarantees 95% accuracy for every individual property."* | Conformal prediction provides marginal (population-level) coverage guarantees, while conditional coverage varies across price tiers ($86.67\% - 100\%$). | *"Conformal prediction achieves 93.70% marginal empirical coverage across the test set, with stratified coverage varying from 86.67% on high-tier luxury properties to 100% on mid-tier rentals."* |

---

## 9. Provenance & Reproducibility Specifications

All experimental parameters are documented for independent verification:
- **Metropolitan Market**: Asheville, North Carolina, USA
- **Data Source**: Inside Airbnb Open Repository (`insideairbnb.com`)
- **Snapshot Date**: December 18, 2023 (`2023-12-18`)
- **Cohort Size ($N$)**: Exactly 1,800 listings (`datasets/multimodal_v3/processed/selected_listing_ids.csv`)
- **Random Seed**: Fixed `random_state = 42` across all splits and models
- **Target Variable**: Nightly listing price in USD (`price_usd`), trained on $\log(1 + \text{Price})$
- **Tabular Model**: `HistGradientBoostingRegressor(max_iter=120, max_depth=6, learning_rate=0.06, min_samples_leaf=12)`
- **Text Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional, PCA reduced to 32-d, 73.65% variance)
- **Image Embedding Model**: `EfficientNet-B0` (ImageNet pretrained, 1,280-dimensional, PCA reduced to 64-d, 57.88% variance)
- **Fused Dimensionality**: Tabular (23-d), Tabular+Text (55-d), Tabular+Image (87-d), Full Multimodal (119-d)

---

## 10. Final Audit Verdict & Recommendations

### A. PASS Items (All Verified 100%)
- [x] **100% Genuine Single-Source Data**: Zero synthetic pairing, zero positional joins, zero cross-city merging.
- [x] **Relational Key Integrity**: 1-to-1 alignment on platform integer `id`.
- [x] **Zero Target / Data Leakage**: All scalers, imputers, encoders, PCA, and calibration scores fitted strictly on training/calibration partitions.
- [x] **Complete Multimodal Quartets**: All 1,800 listings possess valid tabular data, text descriptions, verified downloaded RGB cover photos, and non-null positive prices.
- [x] **Reproducible Ablation Benchmark**: 4-model comparison executed on identical test split ($N=360$).
- [x] **Rigorous SHAP Interpretability**: Global rankings and local waterfall explanations generated without test leakage.
- [x] **Valid Conformal Prediction**: Finite-sample nonconformity calibration achieving 93.70% empirical coverage on untouched test partition.

### B. WARNINGS for Paper Presentation
1. **Multimodal Performance Reality**: Do NOT claim multimodality improved accuracy. Highlight the **empirical finding** that tabular structure dominates pricing, providing an insightful contribution on multimodal noise dilution in real estate pricing.
2. **High-Tier Conformal Undercoverage**: Note in the paper that luxury properties ($> \$185$/night) exhibit higher variance and $86.67\%$ empirical coverage, showing where market uncertainty is concentrated.

### C. REQUIRED FIXES BEFORE PAPER SUBMISSION
1. **Explicitly State Both Split Protocols**: Clarify the 80/20 split for Ablation/SHAP ($1,440 / 360$) and the 70/15/15 split for Conformal Prediction ($1,260 / 270 / 270$).
2. **Remove any Legacy Mentions of Albany / Indian House Rent Pairing**: Ensure the paper clearly separates the legacy tabular Indian dataset study from the single-market Asheville Multimodal V3 benchmark.

### D. OPTIONAL FUTURE IMPROVEMENTS (For Post-Paper / Future Work)
- Explore cross-attention or multimodal transformers (e.g. CLIP / ViT with cross-modal gating) rather than early concatenation PCA fusion.
- Incorporate multi-image galleries if expanded platform scrapers become available in future releases.
- Implement locally adaptive conformal prediction (e.g., Conformalized Quantile Regression) to tighten high-tier intervals.

---
*Audit completed autonomously. All experimental data, scripts, plots, and CSV files in `datasets/multimodal_v3/` are finalized, fully reproducible, and ready for publication.*
