import os
import sys
import re
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CSV = os.path.join(BASE_DIR, "raw", "asheville_20231218_raw_listings.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
SELECTED_IDS_CSV = os.path.join(PROCESSED_DIR, "selected_listing_ids.csv")
SUBSET_RAW_CSV = os.path.join(PROCESSED_DIR, "raw_subset_1800.csv")

os.makedirs(PROCESSED_DIR, exist_ok=True)

def sample_stratified_1800(random_seed=42, target_n=1800):
    print("=" * 70)
    print(f"STRATIFIED SUBSET SELECTION: EXACTLY {target_n} LISTINGS (SEED: {random_seed})")
    print("=" * 70)
    
    df_raw = pd.read_csv(RAW_CSV)
    print(f"Total raw listings: {len(df_raw)}")
    
    # 1. Filter valid listings (3,110 verified cohort)
    df_valid = df_raw[df_raw['price'].notna() & (df_raw['price'] != "") & df_raw['picture_url'].notna()].copy()
    
    # Clean price
    df_valid['price_clean'] = df_valid['price'].astype(str).apply(lambda x: re.sub(r'[^\d.]', '', x))
    df_valid['price_usd'] = pd.to_numeric(df_valid['price_clean'], errors='coerce')
    df_valid = df_valid[df_valid['price_usd'].notna() & (df_valid['price_usd'] > 0)].copy()
    
    total_valid = len(df_valid)
    print(f"Verified candidate multimodal listings: {total_valid}")
    
    # 2. Stratify by 10 Price Decile Bins
    df_valid['price_decile'] = pd.qcut(df_valid['price_usd'], q=10, labels=False, duplicates='drop')
    
    # 3. Stratified Random Sampling of exactly target_n (1,800)
    subset_df, _ = train_test_split(
        df_valid,
        train_size=target_n,
        stratify=df_valid['price_decile'],
        random_state=random_seed
    )
    
    # Sort deterministically by native listing ID
    subset_df = subset_df.sort_values("id").reset_index(drop=True)
    
    # 4. Save selected IDs and subset table
    subset_df[['id', 'price_usd', 'price_decile']].to_csv(SELECTED_IDS_CSV, index=False)
    subset_df.to_csv(SUBSET_RAW_CSV, index=False)
    
    print(f"\nSaved {len(subset_df)} selected listing IDs to: {SELECTED_IDS_CSV}")
    print(f"Saved subset raw records to: {SUBSET_RAW_CSV}")
    
    # 5. Summary Statistics
    p_min = subset_df['price_usd'].min()
    p_p25 = subset_df['price_usd'].quantile(0.25)
    p_med = subset_df['price_usd'].median()
    p_mean = subset_df['price_usd'].mean()
    p_p75 = subset_df['price_usd'].quantile(0.75)
    p_max = subset_df['price_usd'].max()
    
    n_train = int(target_n * 0.80) # 1,440
    n_test = target_n - n_train    # 360
    
    print("\n" + "=" * 50)
    print(f"SELECTED SUBSET (N = {target_n}) PRICE DISTRIBUTION:")
    print("=" * 50)
    print(f"  - Total Sample Size (N)   : {len(subset_df)}")
    print(f"  - Minimum Price (USD)     : ${p_min:.2f}")
    print(f"  - 25th Percentile (p25)   : ${p_p25:.2f}")
    print(f"  - Median Price (p50)      : ${p_med:.2f}")
    print(f"  - Mean Price (Mean)       : ${p_mean:.2f}")
    print(f"  - 75th Percentile (p75)   : ${p_p75:.2f}")
    print(f"  - Maximum Price (USD)     : ${p_max:.2f}")
    print(f"  - Unique Listing IDs      : {subset_df['id'].nunique()}")
    print(f"  - Duplicate Listing IDs   : {subset_df['id'].duplicated().sum()}")
    print("-" * 50)
    print("PLANNED TRAIN / TEST SPLIT (80% / 20%):")
    print(f"  - Planned Training Set (80%): {n_train} listings")
    print(f"  - Planned Held-Out Test (20%): {n_test} listings")
    print("=" * 50)
    
    return subset_df

if __name__ == "__main__":
    sample_stratified_1800()
