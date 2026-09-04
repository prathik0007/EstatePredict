# Dataset Requirements Specification — Multimodal V3

## Objective
Establish a scientifically rigorous, property-level aligned multimodal rental price prediction dataset where **every single record represents a unique real-world property** containing verified target rental price, structured tabular features, rich textual descriptions, and authentic property photographs.

---

## Strict Research Integrity Constraints

1. **Unique Listing/Property ID**: Every record must have an authentic unique primary key (e.g., `listing_id` or `property_id`) sourced directly from the originating platform.
2. **Single-Source Record Integrity**: All four modalities (target price, tabular attributes, text description, and image) must originate from the **exact same listing record** under that unique ID.
3. **No Synthetic Identifiers**: Under no circumstances will synthetic IDs, positional dataframe indices, or arbitrary row pairings be used to merge disparate sources.
4. **No Cross-Continental / Unrelated Splicing**: Indian long-term rental records will NOT be combined with US short-term Airbnb listings or unrelated property imagery.
5. **No 100% Missing Targets**: Any candidate dataset where the rental price field is empty, unpopulated, or non-numeric is strictly disqualified.

---

## Comprehensive Requirement Breakdown

### 1. Dataset Source
- Standard open-access, public real estate / rental listing archives (e.g., Inside Airbnb curated open repository, Kaggle Real Estate Multimodal datasets, or open MLS / public housing portals).

### 2. Dataset Name
- Multimodal Rental Price Benchmark (e.g., Inside Airbnb Open Data with populated pricing and imagery).

### 3. Geographic Coverage
- A clearly defined single metropolitan or regional market (e.g., London, New York City, Paris, Austin, or a unified Indian property portal if authenticated ID-linked media is available) to avoid cross-market currency, regulatory, and purchasing-power confounding.

### 4. Number of Listings
- Target scale: **$1,000$ to $5,000+$** fully populated multimodal property records with valid images, text, tabular features, and prices.

### 5. Target Price Definition
- Standard continuous rental price per night / per month in specified local currency (e.g., USD, EUR, GBP, or INR).
- Must have $0\%$ null values in the processed cohort.
- Skewness must be documented and mathematically stabilized via $\log(1 + \text{Price})$ transformation.

### 6. Listing ID
- Platform-native numerical or alphanumeric unique identifier (e.g., `id`, `listing_id`) serving as the immutable relational key connecting CSV metadata, text embeddings, and downloaded image files (`{listing_id}.jpg`).

### 7. Tabular Features
- **Spatial / Location**: Latitude, longitude, neighbourhood/borough, city, zipcode.
- **Physical Capacity**: Property type, room type, accommodates, bedrooms, beds, bathrooms.
- **Listing Terms**: Minimum nights, maximum nights, availability metrics, instant bookable status.
- **Host & Quality Indicators**: Host response rate, number of reviews, review scores rating.

### 8. Text Fields
- **Primary Description**: `description` or `summary` detailing property features, space, and condition.
- **Contextual Text**: `neighborhood_overview`, `space`, `transit`, `house_rules`.
- **Structured Amenities**: Platform-verified amenity tags (e.g., Air conditioning, Kitchen, WiFi, Elevator, Parking).

### 9. Image Fields
- **Source Link**: `picture_url` pointing to high-resolution property photograph.
- **Local Storage**: Deterministically stored at `datasets/multimodal_v3/images/{listing_id}.jpg`.
- **Integrity Validation**: Image files verified for valid dimensions ($> 200 \times 200$), nonzero byte size, and correct RGB decoding before embedding extraction.

### 10. Licensing & Usage Information
- Permissible open research licenses (e.g., Creative Commons CC0 / CC-BY 4.0, Open Data Commons Public Domain Dedication).

### 11. Property-Level Alignment Method
- **1-to-1 Deterministic Relational Linkage**:
  $$\text{Record}(k) = \left\langle \text{ID}_k, \text{Price}_k, \mathbf{x}_{\text{tab}, k}, \text{Text}_k, \text{ImageFile}(\text{ID}_k.jpg) \right\rangle$$
- Each feature matrix ($X_{\text{tab}}$, $X_{\text{text}}$, $X_{\text{img}}$) is keyed exclusively on $\text{ID}_k$.

### 12. Missing-Value Handling
- **Price Target**: Strict dropping of any record missing target price (no imputation of $y$).
- **Tabular Features**: Median imputation for numerical features; constant `Unknown` category for categoricals, fitted strictly on training folds.
- **Text**: Fallback to title/name if description is missing.
- **Image**: Dropping of listings where image download fails (HTTP 404/timeout) or corrupted image file, preserving only verified 100% complete multimodal quartets.

### 13. Image Availability
- Publicly accessible HTTP/HTTPS URLs with active CDN delivery or pre-packaged downloadable tar/zip archives.

### 14. Text Availability
- Raw text with minimum character threshold ($> 30$ characters) to guarantee substantive semantic signal for transformer feature extractors.
