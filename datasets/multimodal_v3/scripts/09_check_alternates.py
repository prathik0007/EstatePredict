import sys
import pandas as pd
from huggingface_hub import hf_hub_download, list_repo_files
sys.stdout.reconfigure(encoding='utf-8')

def test_repo(repo_id):
    print(f"\nChecking {repo_id}...")
    try:
        files = list_repo_files(repo_id, repo_type="dataset")
        print("Files:", files)
        csv_files = [f for f in files if f.endswith(('.csv', '.parquet', '.csv.gz'))]
        if csv_files:
            f = csv_files[0]
            print(f"Downloading {f}...")
            local_path = hf_hub_download(repo_id=repo_id, filename=f, repo_type="dataset")
            if f.endswith('.parquet'):
                df = pd.read_parquet(local_path)
            else:
                df = pd.read_csv(local_path, nrows=50)
            print(f"Rows: {len(df)}")
            print("Cols:", list(df.columns)[:15])
            if 'description' in df.columns:
                print("Description non-null:", df['description'].dropna().shape[0], "/", len(df))
                if df['description'].dropna().shape[0] > 0:
                    print("Sample description:", repr(str(df['description'].dropna().iloc[0])[:150]))
            if 'price' in df.columns:
                print("Price non-null:", df['price'].dropna().shape[0], "/", len(df))
            if 'picture_url' in df.columns:
                print("Picture_url non-null:", df['picture_url'].dropna().shape[0], "/", len(df))
    except Exception as e:
        print(f"Error {repo_id}: {e}")

if __name__ == "__main__":
    test_repo("alujjdnd/Airbnb-Mar-2022-2023")
    test_repo("gradio/NYC-Airbnb-Open-Data")
    test_repo("kraina/airbnb")
