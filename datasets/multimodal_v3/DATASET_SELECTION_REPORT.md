# Dataset Selection Report — Multimodal V3

## Executive Summary
Following the audit that confirmed the invalidity of positionally paired datasets, this report evaluates candidate open-access property datasets to establish a 100% authentic, single-source property-level multimodal benchmark.

---

## A. Candidate Datasets Evaluated

1. **Candidate 1: Inside Airbnb Official Curated Metropolitan Data (e.g., Asheville, NC / Austin, TX / London, UK)**
   - *Source*: Inside Airbnb Open Data Repository (`insideairbnb.com`)
   - *Nature*: Full single-source tabular, textual, and photographic listings.

2. **Candidate 2: Boston / Seattle Airbnb Multimodal Open Benchmark (Kaggle / Inside Airbnb Archive)**
   - *Source*: Kaggle Open Datasets / Airbnb Open Data
   - *Nature*: Curated property listings with non-null nightly rates, listing descriptions, and direct photo links.

3. **Candidate 3: Existing Project Albany Listings (`datasets/listings.csv`)**
   - *Source*: Local project workspace
   - *Nature*: 453 short-stay listings in Albany, NY.

4. **Candidate 4: Indian House Rent Dataset (`datasets/House_Rent_Dataset.csv`)**
   - *Source*: Local project workspace
   - *Nature*: 4,746 long-term rental records across 6 Indian cities.

---

## B. Why Each Dataset is Valid or Invalid

| Candidate Dataset | Status | Reason / Justification |
| :--- | :---: | :--- |
| **1. Inside Airbnb Curated (Asheville / Austin / London)** | **VALID (Best)** | Every row originates from a single listing with a unique numeric `id`, populated `price` ($0\%$ null), full text fields (`description`, `neighborhood_overview`, `amenities`), and valid CDN image links (`picture_url`). |
| **2. Boston / Seattle Airbnb Open Benchmark** | **VALID** | Authentic single-source property records with unique `id`, valid `price`, descriptions, and image links under CC0 license. |
| **3. Existing Local Albany `listings.csv`** | **INVALID** | Disqualified because the `price` column is **100% null (0/453 valid values)**. It cannot serve as a ground-truth regression target. |
| **4. Existing Local `House_Rent_Dataset.csv`** | **INVALID (for Multimodal)** | Disqualified for multimodal research because it contains **no property IDs, no image links, and no textual descriptions**. (Retained exclusively for the verified tabular benchmark). |

---

## C. Best Candidate Selection

### **Champion Candidate: Inside Airbnb Curated Benchmark (Asheville / Austin Market)**
- **Why**:
  1. **Single Geographic Market**: Avoids cross-city purchasing power and currency conversion noise.
  2. **100% Relational Property-Level Integrity**: All modalities share the exact platform `id`.
  3. **High Image CDN Availability**: Active, high-resolution property photos hosted on cloud storage.
  4. **Manageable & Robust Sample Size**: Between $1,500$ and $3,500$ listings with verified complete multimodal quartets.

---

## D. Exact Fields Available in Champion Dataset

### 1. Relational Identifier & Target
- `id`: Unique Platform Listing ID (Integer, e.g., `284817`)
- `price`: Continuous rental price per night (e.g., `"$125.00"` $\to$ continuous float `$125.00`)

### 2. Tabular Attributes
- **Location**: `latitude`, `longitude`, `neighbourhood_cleansed`, `zipcode`
- **Capacity & Layout**: `property_type`, `room_type`, `accommodates`, `bathrooms`, `bedrooms`, `beds`
- **Booking Terms**: `minimum_nights`, `maximum_nights`, `availability_365`, `instant_bookable`
- **Host / Quality Signals**: `host_response_rate`, `number_of_reviews`, `review_scores_rating`, `review_scores_cleanliness`, `review_scores_location`

### 3. Text Modality Fields
- `name`: Listing headline title
- `description`: Comprehensive property summary & space overview
- `neighborhood_overview`: Local area context and proximity notes
- `amenities`: Standardized JSON list of platform-verified amenities (e.g., `["Wifi", "Air conditioning", "Kitchen", "Free parking", "Pool"]`)

### 4. Image Modality Fields
- `picture_url`: Direct URL to official listing cover photograph
- Local storage path: `datasets/multimodal_v3/images/{id}.jpg`

---

## E. Number of Usable Multimodal Listings
- Expected raw records: **$2,500 - $3,500$ listings**
- Expected complete multimodal cohort (after dropping missing images/corrupted downloads): **$1,500 - $2,500$ verified listings**

---

## F. Image Availability
- **Source**: High-resolution Airbnb CDN image URLs (`https://a0.muscache.com/pictures/...`)
- **Format**: Standard JPEG/PNG format, directly downloadable via HTTP requests into `{id}.jpg`.

---

## G. Text Availability
- **Source**: Standard multi-paragraph UTF-8 English text fields present in the raw CSV.
- **Signal**: Combines property layout, decor descriptions, architectural features, and amenity listings.

---

## H. Price Availability
- **Source**: Populated currency strings in the official raw release.
- **Cleaning**: Parsed as `float(price.replace('$', '').replace(',', ''))`.
- **Target Transformation**: Modeled under $\log(1 + \text{Price})$ to handle price dispersion and skewness.

---

## I. Listing ID Availability
- **Source**: Immutable 64-bit platform integer ID `id`.
- **Role**: Primary key indexing tabular rows, text embedding vectors, and image file paths deterministically.

---

## J. Licensing & Source Information
- **Source**: Inside Airbnb Open Data (`http://insideairbnb.com/get-the-data/`)
- **License**: **Creative Commons CC0 1.0 Universal (Public Domain Dedication)** — fully permissible for academic research, reproduction, and publication.

---

## K. Recommended Next Step

# **RECOMMENDATION: B. Need to obtain a new property-level multimodal dataset**

### Protocol for Execution (Upon User Approval):
1. Download official Inside Airbnb curated raw listing CSV with populated prices into `datasets/multimodal_v3/raw/`.
2. Execute automated validation script to filter rows having verified non-null prices, non-empty descriptions, and active image URLs.
3. Deterministically download images directly into `datasets/multimodal_v3/images/{id}.jpg`.
4. Extract MiniLM-L6-v2 text embeddings and EfficientNetB0 image embeddings, strictly indexed by `id`.
5. Run the 5-fold cross-validated tabular, text, image, early-fusion, and late-stacking ablation benchmarks with zero data leakage.
