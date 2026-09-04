import urllib.request
import json
import gzip
import io
import pandas as pd

def probe():
    # Let's test standard Inside Airbnb snapshot URLs for Asheville, NC
    # Inside Airbnb maintains archive snapshots with listings.csv.gz
    urls = [
        "https://data.insideairbnb.com/united-states/nc/asheville/2024-06-18/data/listings.csv.gz",
        "https://data.insideairbnb.com/united-states/nc/asheville/2024-03-24/data/listings.csv.gz",
        "https://data.insideairbnb.com/united-states/nc/asheville/2023-12-17/data/listings.csv.gz",
        "https://data.insideairbnb.com/united-states/nc/asheville/2023-09-24/data/listings.csv.gz",
        "https://data.insideairbnb.com/united-states/nc/asheville/2023-06-19/data/listings.csv.gz",
    ]
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for url in urls:
        print(f"Testing URL: {url}")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    print(f"SUCCESS: Found snapshot at {url}")
                    # Read header and first few lines
                    gz_data = response.read(1024 * 512) # 512 KB
                    with gzip.GzipFile(fileobj=io.BytesIO(gz_data)) as gz:
                        df_preview = pd.read_csv(gz, nrows=10)
                        print("Columns preview:", list(df_preview.columns)[:15])
                        print("Sample id:", df_preview['id'].head(3).tolist())
                        print("Sample price:", df_preview['price'].head(3).tolist())
                        print("Sample picture_url:", df_preview['picture_url'].head(3).tolist())
                    return url
        except Exception as e:
            print(f"Failed {url}: {e}")
            
    return None

if __name__ == "__main__":
    probe()
