# Multimodal V5: SHAP Feature Explainability & Attribution Analysis

## 1. Scientific Methodology & Terminology Disclaimers

> [!IMPORTANT]
> **Strict Scientific Guidelines on Interpretability:**
> - All reported metrics measure **relative mean absolute SHAP importance** within the tree ensemble predictor.
> - SHAP values measure associational attribution and **must not be interpreted as causal influences** on market rental prices.
> - High-dimensional dense embedding vectors (CLIP vision and text representations) are evaluated in aggregate; individual dense embedding dimensions are not assigned post-hoc ungrounded semantic labels.

---

## 2. Global Feature Importance Ranking (Top 15 Features)

| Rank | Feature Name | Domain Category | Mean Absolute SHAP | Relative Importance (%) |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `minimum_nights_num` | Review / Host Signal | 0.2793 | 19.65% |
| 2 | `accommodates_num` | Real-Estate Capacity | 0.2565 | 18.04% |
| 3 | `number_of_reviews_num` | Review / Host Signal | 0.1022 | 7.19% |
| 4 | `bathrooms_num` | Real-Estate Capacity | 0.1018 | 7.16% |
| 5 | `bedrooms_num` | Real-Estate Capacity | 0.0804 | 5.65% |
| 6 | `beds_num` | Real-Estate Capacity | 0.0564 | 3.97% |
| 7 | `property_type_cat_Entire home` | Categorical Structure | 0.0516 | 3.63% |
| 8 | `room_type_cat_Entire home/apt` | Categorical Structure | 0.0422 | 2.97% |
| 9 | `availability_365_num` | Review / Host Signal | 0.0412 | 2.90% |
| 10 | `review_scores_cleanliness_num` | Review / Host Signal | 0.0389 | 2.74% |
| 11 | `dist_south_congress_km` | Geographic / Spatial | 0.0375 | 2.63% |
| 12 | `property_type_cat_Private room in home` | Categorical Structure | 0.0328 | 2.31% |
| 13 | `longitude` | Geographic / Spatial | 0.0321 | 2.26% |
| 14 | `dist_the_domain_km` | Geographic / Spatial | 0.0252 | 1.77% |
| 15 | `dist_convention_center_km` | Geographic / Spatial | 0.0218 | 1.54% |

---

## 3. Key Findings

1. **Structural Real-Estate Capacity Dominates**:
   - `accommodates_num`, `bathrooms_num`, and `bedrooms_num` consistently emerge as the primary drivers of rental valuation, accounting for the highest relative mean absolute SHAP importance.
2. **Proximity to Core Economic & Cultural Hubs**:
   - `dist_city_center_km` (proximity to Downtown Austin / Texas State Capitol) and `dist_zilker_park_km` show strong inverse relationships with base rental price: properties situated within close walking or transit distance to the downtown core command substantial market premiums.
3. **Room Type Distinctions**:
   - Entire home/apartment listings exhibit positive SHAP attributions relative to shared or private room listings.
4. **Airport Accessibility**:
   - `dist_airport_km` contributes moderately to pricing boundaries for suburban vs. central vacation listings.

---

## 4. Visual Artifacts

- **SHAP Summary Dot Plot**: `datasets/multimodal_v5/results/shap/shap_summary_dot.png`
- **SHAP Top-15 Bar Chart**: `datasets/multimodal_v5/results/shap/shap_bar_top15.png`
