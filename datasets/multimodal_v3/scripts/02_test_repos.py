import requests
import pandas as pd
import io

def test_sources():
    # Let's test well-known public repositories containing complete listings.csv for single markets
    test_urls = [
        ("Austin, TX", "https://raw.githubusercontent.com/datasets/airbnb-listings/master/data/austin-listings.csv"),
        ("Asheville, NC", "https://raw.githubusercontent.com/chriswmann/datasets/master/asheville_listings.csv"),
        ("Seattle, WA (Inside Airbnb)", "https://raw.githubusercontent.com/dianakuzm/airbnb-seattle-price-prediction/main/data/listings.csv"),
        ("Boston, MA (Inside Airbnb)", "https://raw.githubusercontent.com/rebeccabilbro/airbnb-boston/master/data/listings.csv"),
        ("Austin, TX (Inside Airbnb)", "https://raw.githubusercontent.com/granthawkins/inside-airbnb-austin/master/data/listings.csv"),
        ("Portland, OR (Inside Airbnb)", "https://raw.githubusercontent.com/curran/data/gh-pages/airbnb/portland/listings.csv")
    ]
    
    for name, url in test_urls:
        print(f"\nChecking {name}: {url}")
        try:
            r = requests.get(url, stream=True, timeout=10)
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                # Read first few lines
                chunk = b""
                for c in r.iter_content(chunk_size=1024*16):
                    chunk += c
                    if len(chunk) >= 1024 * 64:
                        break
                df = pd.read_csv(io.BytesIO(chunk), nrows=5)
                cols = list(df.columns)
                print(f"Columns count: {len(cols)}")
                print(f"Has id: {'id' in cols}")
                print(f"Has price: {'price' in cols}")
                print(f"Has picture_url: {'picture_url' in cols}")
                print(f"Has description: {'description' in cols or 'summary' in cols}")
                if 'price' in cols:
                    print("Sample prices:", df['price'].tolist())
                if 'picture_url' in cols:
                    print("Sample picture_url:", df['picture_url'].tolist()[:2])
                return name, url
        except Exception as e:
            print(f"Failed: {e}")
            
    return None

if __name__ == "__main__":
    test_sources()
