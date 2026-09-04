# Explainability & Feature Importance Analysis (SHAP)

## 1. Executive Summary & Experimental Framework
This document details the game-theoretic **SHAP (SHapley Additive exPlanations)** analysis conducted on the best-performing **Tabular-Only HistGradientBoosting Regressor** from the verified 1,800-listing Multimodal V3 benchmark (Asheville, NC).

- **Model Explored**: `HistGradientBoostingRegressor` with target transform $\log(1 + \text{Price})$ ($R^2 = 0.5318$, $\text{MAE} = \$74.07$).
- **Partitioning**: Exact 80% Train ($N = 1,440$) / 20% Held-Out Test ($N = 360$) split (`random_state=42`).
- **Explainer Type**: `shap.TreeExplainer` applied strictly to the $360$ held-out test listings.
- **Leakage Prevention**: Zero target information from the test partition was accessed during scaler fitting, imputer calculation, or tree splits.

---

## 2. Global Feature Importance Rankings

The table below shows the top 10 most influential features governing rental price predictions in the Asheville market, ranked by mean absolute SHAP value:

| Rank | Feature Name | Mean |SHAP Value| | Relative Impact (%) |
| :---: | :--- | :---: | :---: |
| 1 | **Accommodates (Guests)** | 0.2301 | 27.10% |
| 2 | **Bathrooms** | 0.1009 | 11.89% |
| 3 | **Longitude** | 0.0850 | 10.01% |
| 4 | **Minimum Nights** | 0.0711 | 8.38% |
| 5 | **Overall Rating** | 0.0574 | 6.76% |
| 6 | **Latitude** | 0.0564 | 6.65% |
| 7 | **Number of Reviews** | 0.0501 | 5.90% |
| 8 | **Beds** | 0.0500 | 5.89% |
| 9 | **Property: Private room in home** | 0.0290 | 3.42% |
| 10 | **Availability (365 Days)** | 0.0237 | 2.80% |


### Key Global Insights:
1. **Capacity & Size Dominate Pricing**: `Accommodates (Guests)` ($27.10\%$ relative importance) and `Bathrooms` ($11.89\%$) represent the primary structural drivers governing rental value.
2. **Geographic Coordinates**: `Longitude` ($10.01\%$) and `Latitude` ($6.65\%$) capture strong neighborhood pricing gradients across downtown Asheville, Biltmore Village, and Blue Ridge mountain ridges.
3. **Booking Constraints & Quality**: `Minimum Nights` ($8.38\%$), `Overall Rating` ($6.76\%$), and `Number of Reviews` ($5.90\%$) provide strong secondary signals reflecting demand density and property tier.
4. **Room & Property Configurations**: Standalone private rooms vs. entire properties establish baseline pricing floors.

---

## 3. Visual Artifacts

The following diagnostic plots were generated and archived:

1. **Global Feature Importance Bar Plot**:
   `datasets/multimodal_v3/results/shap/shap_global_importance_bar.png`
   *(Bar chart depicting mean absolute SHAP contribution across all tabular variables)*

2. **SHAP Beeswarm Summary Plot**:
   `datasets/multimodal_v3/results/shap/shap_beeswarm_summary.png`
   *(Illustrates how high vs. low feature values drive price up or down across the test partition)*

3. **Individual Waterfall Explanations**:
   - High-Tier Luxury Property: `datasets/multimodal_v3/results/shap/shap_waterfall_high_price.png`
   - Median-Tier Property: `datasets/multimodal_v3/results/shap/shap_waterfall_median_price.png`
   - Budget-Tier Property: `datasets/multimodal_v3/results/shap/shap_waterfall_low_price.png`

---

## 4. Representative Local Case Studies

To demonstrate local interpretability, three representative properties from the held-out test partition were audited:

| Case Category | Native Listing ID | Actual Price ($) | Predicted Price ($) | Top Positive Value Drivers | Top Negative Value Dampeners |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Budget / Low-Tier Rental** | `6197585` | $71.00 | $57.59 | Superhost: No (+0.018); Property: Private room in home (+0.013); Room Type: Entire home/apt (+0.009) | Minimum Nights (-0.266); Accommodates (Guests) (-0.245); Bathrooms (-0.076) |
| **Median / Mid-Tier Rental** | `5114762` | $137.00 | $112.08 | Accommodates (Guests) (+0.186); Beds (+0.031); Cleanliness Rating (+0.022) | Bathrooms (-0.166); Number of Reviews (-0.157); Longitude (-0.049) |
| **Luxury / High-Tier Rental** | `934254553856369722` | $595.00 | $553.03 | Number of Reviews (+0.559); Longitude (+0.382); Latitude (+0.175) | Accommodates (Guests) (-0.056); Property: Other (-0.032); Bathrooms (-0.031) |


---

## 5. Verification & Compliance
- **Zero Synthetic Modifications**: All SHAP values correspond to authentic property features and actual held-out listings.
- **Strict Data Isolation**: Evaluated strictly on the held-out test partition without data leakage.
