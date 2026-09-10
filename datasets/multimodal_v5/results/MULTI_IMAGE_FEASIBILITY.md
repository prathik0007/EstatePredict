# Multimodal V5: Multiple Image Feasibility Audit & Empirical Analysis

## 1. Executive Summary & Mandatory Scientific Statement

> [!IMPORTANT]
> **Mandatory Scientific Finding:**
> **"Multi-image aggregation was not performed because the selected public dataset does not provide multiple authentic property images reliably linked to each listing."**

In accordance with strict scientific integrity guidelines, we conducted a comprehensive schema and data pipeline audit of the Inside Airbnb repository to investigate whether genuine sets of 5–10 property images per listing could be acquired without synthetic data fabrication or unverified cross-listing mixing.

---

## 2. Schema Image Field Audit

An exhaustive inspection of all 90 columns in the native Inside Airbnb schema revealed only the following image-related fields:

| Column Name | Field Type | Semantics | Included in Multimodal V5? | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `picture_url` | String (URL) | Primary property cover photo | **YES** | Authentic, listing-specific property image hosted on Airbnb CDN (`a0.muscache.com`). |
| `host_picture_url` | String (URL) | Host personal avatar/portrait | **STRICTLY EXCLUDED** | Depicts human faces/avatars; does not represent the physical real-estate property interior/exterior. Including it would introduce severe bias and face-recognition confounding. |
| `host_thumbnail_url`| String (URL) | Host portrait thumbnail | **STRICTLY EXCLUDED** | Duplicate low-resolution crop of host avatar; scientifically invalid for property valuation. |

---

## 3. Quantitative Property Image Availability

| Image Count Threshold | Number of Listings Meeting Threshold | Percentage of Cohort | Feasibility Status |
| :--- | :--- | :--- | :--- |
| **$\ge 1$ Authentic Property Image** | **5,050** | **100.0%** | **Fully Implemented in V5** (Verified 1-to-1 download) |
| **$\ge 2$ Authentic Property Images** | **0** | **0.0%** | **Unavailable** (Single primary photo provided in feed) |
| **$\ge 5$ Authentic Property Images** | **0** | **0.0%** | **Unavailable** (Requires live dynamic web scraping) |
| **$\ge 10$ Authentic Property Images**| **0** | **0.0%** | **Unavailable** (Requires live dynamic web scraping) |

---

## 4. Why Secondary Image Fabrication Was Rejected

To maintain the highest level of research integrity, the following prohibited practices were strictly rejected:

1. **Positional Image Matching Across Listings**:
   - Pairing Listing A's kitchen with Listing B's bathroom based on proximity or room type is scientifically fraudulent.
2. **Unauthenticated Live Scraping of Dynamic AirBnB Carousels**:
   - Inside Airbnb data releases deliberately provide static snapshots of the public tabular and primary image data. Scraping live carousel assets for snapshot listings risks severe temporal leakage, mismatched renovations, 404 dead links, and violation of Airbnb Terms of Service.
3. **Host Profile Image Mixing**:
   - Using host profile pictures as secondary property photos introduces facial recognition confounding, demographic bias, and spurious correlations.

---

## 5. Conclusion & Research Recommendation

The V5 multimodal pipeline correctly utilizes the single authentic primary property image (`picture_url`) via modern CLIP vision embeddings (`CLIP ViT-B/32`), which captures high-level architectural, aesthetic, and stylistic qualities. The lack of multi-image sequences per listing is a structural limitation of open-source real estate benchmarks and is formally documented as an open challenge for future multi-view real estate datasets.
