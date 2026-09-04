import os
import sys
import re
import json
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.model_selection import train_test_split

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CSV = os.path.join(BASE_DIR, "raw", "asheville_20231218_raw_listings.csv")
IMAGES_DIR = os.path.join(BASE_DIR, "images")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
COHORT_CSV = os.path.join(PROCESSED_DIR, "multimodal_cohort.csv")
SELECTED_IDS_CSV = os.path.join(PROCESSED_DIR, "selected_listing_ids.csv")

os.makedirs(PROCESSED_DIR, exist_ok=True)

def parse_bathrooms(val):
    if pd.isna(val):
        return 1.0
    val_str = str(val).lower()
    if 'half' in val_str:
        return 0.5
    match = re.search(r'([\d\.]+)', val_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return 1.0
    return 1.0

def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_amenities(val):
    if pd.isna(val):
        return ""
    try:
        if isinstance(val, str) and val.startswith('['):
            items = json.loads(val.replace("'", '"'))
            return ", ".join(items)
    except Exception:
        pass
    cleaned = str(val).replace('[', '').replace(']', '').replace('"', '').replace("'", '')
    return cleaned

def build_multimodal_cohort(target_n=1800, random_seed=42):
    print("=" * 70)
    print(f"STAGE 2 & 3: PREPROCESSING & EXACT {target_n}-LISTING MULTIMODAL COHORT CREATION")
    print("=" * 70)
    
    df_raw = pd.read_csv(RAW_CSV)
    print(f"Total raw listings in Asheville snapshot: {len(df_raw)}")
    
    # 1. Clean Price
    df_raw['price_clean'] = df_raw['price'].apply(lambda x: re.sub(r'[^\d.]', '', str(x)) if pd.notna(x) else "")
    df_raw['price_usd'] = pd.to_numeric(df_raw['price_clean'], errors='coerce')
    
    # 2. Match only listings with verified image files on disk
    valid_rows = []
    for idx, row in df_raw.iterrows():
        listing_id = row['id']
        price = row['price_usd']
        
        if pd.isna(price) or price <= 0:
            continue
            
        img_file = os.path.join(IMAGES_DIR, f"{listing_id}.jpg")
        if not os.path.exists(img_file) or os.path.getsize(img_file) < 100:
            continue
            
        try:
            with Image.open(img_file) as img:
                img.verify()
        except Exception:
            continue
            
        valid_rows.append(row)
        
    df_available = pd.DataFrame(valid_rows)
    print(f"Total listings with valid price & verified image on disk: {len(df_available)}")
    
    # 3. Stratified Sampling of exactly target_n (1,800) by Price Deciles
    df_available['price_decile'] = pd.qcut(df_available['price_usd'], q=10, labels=False, duplicates='drop')
    
    df_sampled, _ = train_test_split(
        df_available,
        train_size=target_n,
        stratify=df_available['price_decile'],
        random_state=random_seed
    )
    
    # Sort deterministically by native listing ID
    df_sampled = df_sampled.sort_values("id").reset_index(drop=True)
    df_sampled[['id', 'price_usd', 'price_decile']].to_csv(SELECTED_IDS_CSV, index=False)
    print(f"Stratified sample of {len(df_sampled)} listing IDs saved to {SELECTED_IDS_CSV}")
    
    # 4. Extract Tabular Features
    df_sampled['latitude_numeric'] = pd.to_numeric(df_sampled['latitude'], errors='coerce').fillna(df_sampled['latitude'].median())
    df_sampled['longitude_numeric'] = pd.to_numeric(df_sampled['longitude'], errors='coerce').fillna(df_sampled['longitude'].median())
    df_sampled['accommodates_numeric'] = pd.to_numeric(df_sampled['accommodates'], errors='coerce').fillna(2.0)
    df_sampled['bathrooms_numeric'] = df_sampled['bathrooms_text'].apply(parse_bathrooms)
    df_sampled['beds_numeric'] = pd.to_numeric(df_sampled['beds'], errors='coerce').fillna(df_sampled['accommodates_numeric'] / 2.0).clip(lower=1.0)
    df_sampled['num_reviews'] = pd.to_numeric(df_sampled['number_of_reviews'], errors='coerce').fillna(0)
    df_sampled['rating'] = pd.to_numeric(df_sampled['review_scores_rating'], errors='coerce').fillna(df_sampled['review_scores_rating'].median())
    df_sampled['rating_cleanliness'] = pd.to_numeric(df_sampled['review_scores_cleanliness'], errors='coerce').fillna(df_sampled['review_scores_cleanliness'].median())
    df_sampled['min_nights'] = pd.to_numeric(df_sampled['minimum_nights'], errors='coerce').fillna(1.0).clip(upper=30)
    df_sampled['avail_365'] = pd.to_numeric(df_sampled['availability_365'], errors='coerce').fillna(0)
    
    df_sampled['room_type_clean'] = df_sampled['room_type'].fillna('Entire home/apt')
    
    top_prop_types = ['Entire home', 'Entire rental unit', 'Entire guest suite', 'Entire guesthouse', 'Private room in home', 'Entire cottage']
    df_sampled['property_type_grouped'] = df_sampled['property_type'].apply(lambda x: x if x in top_prop_types else 'Other')
    df_sampled['is_superhost'] = df_sampled['host_is_superhost'].apply(lambda x: 1 if str(x).lower() == 't' else 0)
    
    # 5. Extract Text Features
    df_sampled['clean_name'] = df_sampled['name'].apply(clean_text)
    df_sampled['clean_description'] = df_sampled['description'].apply(clean_text)
    df_sampled['clean_neighborhood'] = df_sampled['neighborhood_overview'].apply(clean_text)
    df_sampled['clean_amenities'] = df_sampled['amenities'].apply(parse_amenities)
    
    def build_text(row):
        parts = []
        if row['clean_name']:
            parts.append(f"Title: {row['clean_name']}.")
        if row['room_type_clean']:
            parts.append(f"Property Type: {row['room_type_clean']}.")
        if row['clean_description']:
            parts.append(f"Description: {row['clean_description']}.")
        if row['clean_neighborhood']:
            parts.append(f"Neighborhood: {row['clean_neighborhood']}.")
        if row['clean_amenities']:
            parts.append(f"Amenities: {row['clean_amenities']}.")
        return " ".join(parts)
        
    df_sampled['combined_text'] = df_sampled.apply(build_text, axis=1)
    df_sampled['image_path'] = df_sampled['id'].apply(lambda x: os.path.join(IMAGES_DIR, f"{x}.jpg"))
    df_sampled['price_log1p'] = np.log1p(df_sampled['price_usd'])
    
    # Save Final 1,800 Cohort
    df_sampled.to_csv(COHORT_CSV, index=False)
    print(f"Final aligned multimodal cohort of {len(df_sampled)} listings saved to {COHORT_CSV}")
    
    print("\n" + "=" * 50)
    print("FINAL 1,800 MULTIMODAL COHORT SUMMARY:")
    print("=" * 50)
    print(f"  - Verified Listings (N)     : {len(df_sampled)}")
    print(f"  - Minimum Price (USD)       : ${df_sampled['price_usd'].min():.2f}")
    print(f"  - 25th Percentile (p25)     : ${df_sampled['price_usd'].quantile(0.25):.2f}")
    print(f"  - Median Price (p50)        : ${df_sampled['price_usd'].median():.2f}")
    print(f"  - Mean Price (Mean)         : ${df_sampled['price_usd'].mean():.2f}")
    print(f"  - 75th Percentile (p75)     : ${df_sampled['price_usd'].quantile(0.75):.2f}")
    print(f"  - Maximum Price (USD)       : ${df_sampled['price_usd'].max():.2f}")
    print(f"  - Verified Image Files      : {df_sampled['image_path'].apply(os.path.exists).sum()} / {len(df_sampled)}")
    print("=" * 50)
    
    return df_sampled

if __name__ == "__main__":
    build_multimodal_cohort(target_n=1800, random_seed=42)
