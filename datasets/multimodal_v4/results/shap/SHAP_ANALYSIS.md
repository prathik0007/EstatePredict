# Phase 11: SHAP Interpretability & Feature Attribution Analysis

## 1. Interpretability Protocol & Methodological Guardrails
- **Model Explained**: `HistGradientBoostingRegressor` predicting $\log(1 + 	ext{Price})$ on the verified Asheville V4 benchmark.
- **Evaluation Partition**: Sequestered held-out test partition ($N = 360$, strictly untouched during training).
- **Explainability Tool**: `shap.TreeExplainer` computing exact Shapley feature attributions in log-price space.
- **Causality Disclosure**: SHAP attributions quantify the **associative contribution of each feature to the model's conditional price expectation**, not causal economic mechanisms.

---

## 2. Global Modality & Feature Category Attribution

| Feature Modality Group | Included Attributes | Aggregate SHAP Weight (%) |
| :--- | :--- | :---: |
| **Tabular Capacity & Structure** | Accommodates, Bathrooms, Beds | **42.63%** |
| **Geographic & Spatial** | Coordinates + 7 Landmark Distances | **25.11%** |
| **Reputation & Booking Constraints** | Ratings, Reviews, Minimum Nights, Availability | **21.98%** |
| **Categorical Types & Superhost** | Property Type, Room Type, Superhost Flag | **10.29%** |

---

## 3. Top Influential Features Table

| Rank | Feature Attribute | Mean Absolute SHAP ($|\phi|$) | Relative Attribution Weight (%) | Directional Impact on Rental Price |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Accommodates (Guests)** | **0.2245** | **24.90%** | Higher capacity strongly increases nightly rate |
| **2** | **Bathrooms Count** | **0.1076** | **11.93%** | More bathrooms significantly raises price tier |
| **3** | **Minimum Nights Requirement** | **0.0685** | **7.59%** | East/West spatial gradient in Asheville market |
| **4** | **Distance to City Center (km)** | **0.0568** | **6.30%** | Short-term vs long-term booking flexibility |
| **5** | **Overall Rating Score** | **0.0533** | **5.91%** | Proximity to downtown cultural / commercial hub |

---

## 4. Key Findings
1. **Dominance of Capacity and Bathrooms**: Guest capacity (`Accommodates`) and bathroom count remain the primary pricing anchors, accounting for over ~35% of total predictive power.
2. **Spatial Feature Attribution**: Raw spatial coordinates and distance to city center/attractions contribute meaningfully (~20-25%), validating that location remains an essential pricing signal.
3. **Artifacts Generated**:
   - `shap_feature_importance.csv`: Exact numeric attributions
   - `shap_summary_bar.png`: Global bar ranking
   - `shap_beeswarm.png`: Feature impact distributions across all test listings
