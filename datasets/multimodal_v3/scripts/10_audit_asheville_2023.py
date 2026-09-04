import sys
import pandas as pd
from huggingface_hub import hf_hub_download
sys.stdout.reconfigure(encoding='utf-8')

def test_asheville_2023():
    repo_id = "alujjdnd/Airbnb-Mar-2022-2023"
    filename = "raw_dl/united-states_nc_asheville_2023-03-19.csv.gz"
    
    print(f"Downloading {filename} from {repo_id}...")
    local_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    print(f"Downloaded to {local_path}")
    
    df = pd.read_csv(local_path, compression='gzip')
    print(f"\nTotal Listings (Rows): {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    
    # Audit primary keys
    print(f"\n1. ID Check ('id'):")
    print(f"   - Present: {'id' in df.columns}")
    print(f"   - Unique count: {df['id'].nunique()}")
    print(f"   - Duplicate count: {df['id'].duplicated().sum()}")
    print(f"   - Sample IDs: {df['id'].head(5).tolist()}")
    
    # Audit Price Target
    print(f"\n2. Price Target Check ('price'):")
    print(f"   - Present: {'price' in df.columns}")
    price_non_null = df['price'].dropna()
    print(f"   - Non-null count: {len(price_non_null)} / {len(df)} ({len(price_non_null)/len(df)*100:.2f}%)")
    print(f"   - Sample raw prices: {price_non_null.head(5).tolist()}")
    
    # Audit Text
    print(f"\n3. Text Modality Check:")
    print(f"   - 'name' non-null: {df['name'].dropna().shape[0]} / {len(df)}")
    print(f"   - 'description' non-null: {df['description'].dropna().shape[0]} / {len(df)} ({df['description'].dropna().shape[0]/len(df)*100:.2f}%)")
    print(f"   - 'neighborhood_overview' non-null: {df['neighborhood_overview'].dropna().shape[0]} / {len(df)}")
    print(f"   - 'amenities' non-null: {df['amenities'].dropna().shape[0]} / {len(df)}")
    if df['description'].dropna().shape[0] > 0:
        print(f"   - Sample description: {repr(str(df['description'].dropna().iloc[0])[:180])}")
        
    # Audit Image URLs
    print(f"\n4. Image Modality Check ('picture_url'):")
    print(f"   - Present: {'picture_url' in df.columns}")
    pic_non_null = df['picture_url'].dropna()
    print(f"   - Non-null count: {len(pic_non_null)} / {len(df)} ({len(pic_non_null)/len(df)*100:.2f}%)")
    print(f"   - Sample picture_url: {pic_non_null.head(3).tolist()}")
    
    # Audit Tabular Features
    tab_cols = ['room_type', 'property_type', 'accommodates', 'bathrooms_text', 'bedrooms', 'beds', 'latitude', 'longitude', 'number_of_reviews', 'review_scores_rating']
    print(f"\n5. Key Tabular Features Check:")
    for col in tab_cols:
        if col in df.columns:
            print(f"   - '{col}': {df[col].dropna().shape[0]} / {len(df)} ({df[col].dropna().shape[0]/len(df)*100:.2f}%) non-null")
            
    return df

if __name__ == "__main__":
    test_asheville_2023()
