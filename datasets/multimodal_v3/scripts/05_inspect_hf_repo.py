import os
import pandas as pd
from huggingface_hub import hf_hub_download, list_repo_files

def test_hf_repo():
    repo_id = "MongoDB/airbnb_embeddings"
    print(f"Listing files in {repo_id}...")
    try:
        files = list_repo_files(repo_id, repo_type="dataset")
        print("Repo files:", files)
        parquet_files = [f for f in files if f.endswith(".parquet")]
        if parquet_files:
            file_to_download = parquet_files[0]
            print(f"Downloading {file_to_download}...")
            local_path = hf_hub_download(repo_id=repo_id, filename=file_to_download, repo_type="dataset")
            df = pd.read_parquet(local_path)
            print(f"Total rows: {len(df)}")
            print("Columns:", list(df.columns))
            print("Sample ID:", df['_id'].head(3).tolist() if '_id' in df.columns else df['id'].head(3).tolist())
            print("Sample price:", df['price'].head(5).tolist() if 'price' in df.columns else "No price")
            print("Sample summary:", df['summary'].head(2).tolist() if 'summary' in df.columns else "No summary")
            print("Sample images:", df['images'].head(2).tolist() if 'images' in df.columns else "No images")
            return df
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_hf_repo()
