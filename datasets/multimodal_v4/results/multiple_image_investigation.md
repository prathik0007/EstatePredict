# Phase 5: Multiple Property Images Scientific Investigation

## 1. Executive Summary & Core Finding
In accordance with Phase 5 guidelines, we conducted a forensic investigation into the raw dataset (`asheville_20231218_raw_listings.csv`, official Inside Airbnb Asheville snapshot) to ascertain whether multiple authentic property photographs are available per listing.

**Formal Determination**:
> [!IMPORTANT]
> The Inside Airbnb raw listings schema provides **exactly ONE authentic property photograph URL** per listing: the primary listing cover photo (`picture_url`).
> All other media columns in the dataset (`host_thumbnail_url`, `host_picture_url`) depict **host profile photographs**, not property interiors or structures.
> In strict compliance with the scientific directive forbidding the use of host profile photos or unverified internet imagery, **no authentic multi-image galleries exist in the verified single-market snapshot**.

---

## 2. Schema Column Audit

| Column Name | Modality Type | Semantic Content | Property Photo? | Evaluation Decision |
| :--- | :--- | :--- | :---: | :--- |
| `listing_url` | Web Link | URL to the web listing page | No | Excluded (HTML page link) |
| `picture_url` | Image URL | Primary listing cover photograph | **YES** | **Retained as verified primary image** |
| `host_url` | Web Link | URL to host profile page | No | Excluded (HTML page link) |
| `host_thumbnail_url` | Image URL | Thumbnail photo of the human host | No | **Excluded** (host avatar, not property) |
| `host_picture_url` | Image URL | Full-size photo of the human host | No | **Excluded** (host avatar, not property) |
| `host_has_profile_pic` | Binary Flag | Indicator if host has an avatar | No | Excluded (metadata flag) |

---

## 3. Scientific Integrity & Avoidance of Synthetic / Hallucinated Imagery
The research protocol strictly specifies:
- Do NOT use arbitrary internet images
- Do NOT use host profile images
- Do NOT mix images between properties
- Do NOT assume `os.listdir()` ordering represents listing order
- Do NOT create fake image associations

Because Inside Airbnb does not distribute secondary property gallery images (e.g. bathroom, bedroom, kitchen) within its public data dumps, aggregating fake or mismatched multi-image representations would constitute data falsification and compromise out-of-sample validity.

---

## 4. Methodological Conclusion & Documented Limitation
- **Single Authentic Image Baseline**: Exactly 1 verified, authentic RGB property cover photo exists per listing on disk (`images/{id}.jpg`).
- **Research Implication**: The single authentic image representation evaluated in Phase 3 (CLIP image encoder) and Phase 2 (EfficientNet-B0) represents the true reproducible ceiling for image data from official Inside Airbnb distributions.
- **Future Work Recommendation**: Multi-image representation learning (mean pooling vs attention pooling over 3, 5, or 10 photos) requires custom multi-photo web scrapers that capture full property galleries directly from active real estate listings while preserving strict platform ID joins.
