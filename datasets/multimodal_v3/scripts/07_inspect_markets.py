import os
import pandas as pd
from huggingface_hub import hf_hub_download, list_repo_files

def inspect_single_market(repo_id):
    print(f"\n=======================================================")
    print(f"Inspecting Repository: {repo_id}")
    print(f"=======================================================")
    files = list_repo_files(repo_id, repo_type="dataset")
    print(f"Files in repo: {files}")
    
    csv_files = [f for f in files if f.endswith(('.csv', '.csv.gz', '.parquet', '.json')) and 'listing' in f.lower()]
    if not csv_files:
        csv_files = [f for f in files if f.endswith(('.csv', '.csv.gz', '.parquet', '.json'))]
        
    print(f"Candidate data files: {csv_files}")
    
    for f in csv_files:
        print(f"\nDownloading {f}...")
        local_file = hf_hub_download(repo_id=repo_id, filename=f, repo_type="dataset")
        print(f"Local path: {local_file}")
        
        if f.endswith('.csv'):
            df = pd.read_csv(local_file)
        elif f.endswith('.csv.gz'):
            df = pd.read_csv(local_file, compression='gzip')
        elif f.endswith('.parquet'):
            df = pd.read_parquet(local_file)
        else:
            continue
            
        print(f"Total Rows: {len(df)}")
        print(f"Total Columns: {len(df.columns)}")
        print(f"Column Names Sample: {list(df.columns)[:20]}")
        
        # Check key fields
        has_id = 'id' in df.columns
        has_price = 'price' in df.columns
        has_pic = 'picture_url' in df.columns
        has_desc = 'description' in df.columns
        
        print(f"\nField Availability Check:")
        print(f"  - Listing ID present ('id'): {has_id}")
        if has_id:
            print(f"    Unique IDs count: {df['id'].nunique()} (Duplicates: {df['id'].duplicated().sum()})")
            print(f"    Sample IDs: {df['id'].head(3).tolist()}")
            
        print(f"  - Price present ('price'): {has_price}")
        if has_price:
            non_null_price = df['price'].dropna()
            print(f"    Non-null price count: {len(non_null_price)} / {len(df)} ({len(non_null_price)/len(df)*100:.2f}%)")
            print(f"    Sample raw prices: {non_null_price.head(5).tolist()}")
            
        print(f"  - Image URL present ('picture_url'): {has_pic}")
        if has_pic:
            non_null_pic = df['picture_url'].dropna()
            print(f"    Non-null picture_url count: {len(non_null_pic)} / {len(df)} ({len(non_null_pic)/len(df)*100:.2f}%)")
            print(f"    Sample picture_url: {non_null_pic.head(2).tolist()}")
            
        print(f"  - Description present ('description'): {has_desc}")
        if has_desc:
            non_null_desc = df['description'].dropna()
            print(f"    Non-null description count: {len(non_null_desc)} / {len(df)} ({len(non_null_desc)/len(df)*100:.2f}%)")
            print(f"    Sample description length: {[len(str(x)) for x in non_null_desc.head(3)]}")
            
        return df

if __name__ == "__main__":
    df_asheville = inspect_single_market("michaelmallari/airbnb-usa-nc-asheville")
    df_austin = inspect_single_market("michaelmallari/airbnb-usa-tx-austin")
