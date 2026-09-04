import sys
import requests
import pandas as pd
from PIL import Image
import io
sys.stdout.reconfigure(encoding='utf-8')

def test_sample_images():
    asheville_path = r"C:\Users\prath\.cache\huggingface\hub\datasets--michaelmallari--airbnb-usa-nc-asheville\snapshots\2c16ace1cbeaf3c30c37383fd914b01677d56ab1\20231218-listings-detailed.csv"
    df = pd.read_csv(asheville_path)
    
    print(f"Total listings: {len(df)}", flush=True)
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    for i in range(3):
        row = df.iloc[i]
        listing_id = row['id']
        img_url = row['picture_url']
        price = row['price']
        
        print(f"\n[{i+1}/3] Listing ID: {listing_id} | Price: {price}", flush=True)
        print(f"URL: {img_url}", flush=True)
        
        try:
            r = requests.get(img_url, headers=headers, timeout=8)
            print(f"Status Code: {r.status_code}", flush=True)
            if r.status_code == 200:
                img_bytes = io.BytesIO(r.content)
                img = Image.open(img_bytes)
                print(f"  -> SUCCESS: {img.format}, {img.mode}, Size: {img.size}", flush=True)
        except Exception as e:
            print(f"  -> Error: {e}", flush=True)

if __name__ == "__main__":
    test_sample_images()
