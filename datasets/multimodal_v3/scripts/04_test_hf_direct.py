import requests
import pandas as pd
import io

def test_hf_direct():
    # Hugging Face resolve URLs provide direct downloads without requiring git/datasets package
    urls = [
        ("San Francisco 2024-03 (HuggingFace)", "https://huggingface.co/datasets/bstraehle/airbnb-san-francisco-202403-embed/resolve/main/data/train-00000-of-00001.parquet"),
        ("Austin, TX (jsDelivr CDN)", "https://cdn.jsdelivr.net/gh/datasets/airbnb-listings@master/data/austin-listings.csv"),
        ("Boston, MA (jsDelivr CDN)", "https://cdn.jsdelivr.net/gh/rebeccabilbro/airbnb-boston@master/data/listings.csv")
    ]
    
    for name, url in urls:
        print(f"\nChecking {name}: {url}")
        try:
            r = requests.get(url, stream=True, timeout=15)
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                content = r.content
                print(f"Downloaded {len(content)} bytes")
                if url.endswith(".parquet"):
                    df = pd.read_parquet(io.BytesIO(content))
                else:
                    df = pd.read_csv(io.BytesIO(content))
                print(f"Total rows: {len(df)}")
                print(f"Columns: {list(df.columns)[:15]}")
                print(f"Has id: {'id' in df.columns}")
                print(f"Has price: {'price' in df.columns}")
                print(f"Has picture_url: {'picture_url' in df.columns}")
                print(f"Has description: {'description' in df.columns}")
                if 'price' in df.columns:
                    print("Sample prices:", df['price'].head(5).tolist())
                    print("Price null count:", df['price'].isna().sum())
                if 'picture_url' in df.columns:
                    print("Sample picture_url:", df['picture_url'].head(2).tolist())
                return name, url, df
        except Exception as e:
            print(f"Error: {e}")
            
    return None

if __name__ == "__main__":
    test_hf_direct()
