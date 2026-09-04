import requests
import pandas as pd
import io
import gzip

def test_fetch():
    # Let's test standard Inside Airbnb URLs with full browser headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    
    # Test Austin, TX or Asheville, NC or Salem, OR
    test_urls = [
        ("Asheville, NC", "2024-03-24", "https://data.insideairbnb.com/united-states/nc/asheville/2024-03-24/data/listings.csv.gz"),
        ("Austin, TX", "2024-03-24", "https://data.insideairbnb.com/united-states/tx/austin/2024-03-24/data/listings.csv.gz"),
        ("Salem, OR", "2024-03-24", "https://data.insideairbnb.com/united-states/or/salem-or/2024-03-24/data/listings.csv.gz"),
        ("Cambridge, MA", "2024-03-24", "https://data.insideairbnb.com/united-states/ma/cambridge/2024-03-24/data/listings.csv.gz"),
        ("Asheville, NC (Archive)", "2023-09-24", "https://data.insideairbnb.com/united-states/nc/asheville/2023-09-24/data/listings.csv.gz")
    ]
    
    for city, snap, url in test_urls:
        print(f"\nTesting {city} ({snap}): {url}")
        try:
            r = requests.get(url, headers=headers, stream=True, timeout=15)
            print(f"Status Code: {r.status_code}")
            if r.status_code == 200:
                print(f"Content-Length: {r.headers.get('content-length', 'unknown')}")
                # Read 500KB
                chunk = b""
                for c in r.iter_content(chunk_size=1024*64):
                    chunk += c
                    if len(chunk) >= 1024 * 512:
                        break
                with gzip.GzipFile(fileobj=io.BytesIO(chunk)) as gz:
                    df = pd.read_csv(gz, nrows=10)
                    print("Sample columns:", list(df.columns)[:10])
                    print("Sample ID:", df['id'].head(3).tolist())
                    print("Sample Price:", df['price'].head(3).tolist())
                    print("Sample Picture URL:", df['picture_url'].head(3).tolist())
                    print("Sample Description len:", [len(str(x)) for x in df['description'].head(3)])
                return city, snap, url
        except Exception as e:
            print(f"Error: {e}")
            
    return None

if __name__ == "__main__":
    test_fetch()
