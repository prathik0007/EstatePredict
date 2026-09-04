import os
import sys
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
from PIL import Image
import io
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBSET_CSV = os.path.join(BASE_DIR, "processed", "raw_subset_1800.csv")
IMAGES_DIR = os.path.join(BASE_DIR, "images")
RESULTS_DIR = os.path.join(BASE_DIR, "results")
AUDIT_CSV = os.path.join(RESULTS_DIR, "image_download_audit_1800.csv")

os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def create_session():
    s = requests.Session()
    adapter = HTTPAdapter(pool_connections=40, pool_maxsize=40, max_retries=Retry(total=1, backoff_factor=0.2))
    s.mount('https://', adapter)
    s.mount('http://', adapter)
    s.headers.update(HEADERS)
    return s

session = create_session()

def download_and_validate_single_image(row_tuple):
    listing_id, img_url = row_tuple
    out_path = os.path.join(IMAGES_DIR, f"{listing_id}.jpg")
    
    # If already downloaded and valid, skip
    if os.path.exists(out_path) and os.path.getsize(out_path) > 100:
        try:
            with Image.open(out_path) as img:
                img.verify()
            with Image.open(out_path) as img:
                width, height = img.size
                mode = img.mode
            with open(out_path, "rb") as f:
                img_hash = hashlib.md5(f.read()).hexdigest()
            return {
                "id": listing_id,
                "url": img_url,
                "status": "success_cached",
                "http_code": 200,
                "file_path": out_path,
                "file_size": os.path.getsize(out_path),
                "width": width,
                "height": height,
                "mode": mode,
                "md5_hash": img_hash,
                "error": None
            }
        except Exception:
            pass # re-download if corrupt
            
    if pd.isna(img_url) or not str(img_url).startswith("http"):
        return {
            "id": listing_id,
            "url": str(img_url),
            "status": "failed_invalid_url",
            "http_code": None,
            "file_path": None,
            "file_size": 0,
            "width": 0,
            "height": 0,
            "mode": None,
            "md5_hash": None,
            "error": "Invalid or missing URL"
        }
        
    try:
        r = session.get(img_url, timeout=4.0)
        if r.status_code != 200:
            return {
                "id": listing_id,
                "url": img_url,
                "status": f"failed_http_{r.status_code}",
                "http_code": r.status_code,
                "file_path": None,
                "file_size": 0,
                "width": 0,
                "height": 0,
                "mode": None,
                "md5_hash": None,
                "error": f"HTTP {r.status_code}"
            }
            
        content = r.content
        if len(content) < 100:
            return {
                "id": listing_id,
                "url": img_url,
                "status": "failed_empty_file",
                "http_code": 200,
                "file_path": None,
                "file_size": len(content),
                "width": 0,
                "height": 0,
                "mode": None,
                "md5_hash": None,
                "error": "File size too small"
            }
            
        img_bytes = io.BytesIO(content)
        img = Image.open(img_bytes)
        img.verify()
        
        # Re-open for conversion and dimensions
        img = Image.open(io.BytesIO(content))
        width, height = img.size
        
        # Ensure RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.save(out_path, format="JPEG", quality=85)
        img_hash = hashlib.md5(content).hexdigest()
        
        return {
            "id": listing_id,
            "url": img_url,
            "status": "success",
            "http_code": 200,
            "file_path": out_path,
            "file_size": os.path.getsize(out_path),
            "width": width,
            "height": height,
            "mode": "RGB",
            "md5_hash": img_hash,
            "error": None
        }
        
    except Exception as e:
        return {
            "id": listing_id,
            "url": img_url,
            "status": "failed_timeout_or_error",
            "http_code": None,
            "file_path": None,
            "file_size": 0,
            "width": 0,
            "height": 0,
            "mode": None,
            "md5_hash": None,
            "error": str(e)
        }

def download_subset_images(max_workers=32):
    print("=" * 70, flush=True)
    print("STAGE 1: ASHEVILLE MULTIMODAL V3 IMAGE DOWNLOAD (1,800 SUBSET)", flush=True)
    print("=" * 70, flush=True)
    
    df_subset = pd.read_csv(SUBSET_CSV)
    tasks = [(row['id'], row['picture_url']) for _, row in df_subset.iterrows()]
    total = len(tasks)
    print(f"Total target listings: {total} | Workers: {max_workers}", flush=True)
    
    results = []
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_and_validate_single_image, task): task for task in tasks}
        
        completed = 0
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            completed += 1
            if completed % 100 == 0 or completed == total:
                elapsed = time.time() - start_time
                succ = sum(1 for r in results if r['status'].startswith('success'))
                fail = completed - succ
                rate = completed / elapsed if elapsed > 0 else 0
                print(f"[{completed}/{total}] ({completed/total*100:.1f}%) | Success: {succ} | Failed: {fail} | Speed: {rate:.1f} imgs/s", flush=True)
                
    audit_df = pd.DataFrame(results)
    audit_df.to_csv(AUDIT_CSV, index=False)
    print(f"\nDownload audit saved to {AUDIT_CSV}", flush=True)
    
    succ_df = audit_df[audit_df['status'].isin(['success', 'success_cached'])]
    fail_df = audit_df[~audit_df['status'].isin(['success', 'success_cached'])]
    
    print("\n" + "=" * 50, flush=True)
    print("1,800 SUBSET IMAGE DOWNLOAD SUMMARY:", flush=True)
    print("=" * 50, flush=True)
    print(f"  - Total Target Listings  : {total}", flush=True)
    print(f"  - Successfully Verified  : {len(succ_df)} ({len(succ_df)/total*100:.2f}%)", flush=True)
    print(f"  - Failed / Expired URLs  : {len(fail_df)} ({len(fail_df)/total*100:.2f}%)", flush=True)
    print(f"  - Unique Image Hashes    : {succ_df['md5_hash'].nunique()}", flush=True)
    print(f"  - Duplicate Hashes       : {len(succ_df) - succ_df['md5_hash'].nunique()}", flush=True)
    if len(succ_df) > 0:
        print(f"  - Average Dimensions     : {succ_df['width'].mean():.0f} x {succ_df['height'].mean():.0f}", flush=True)
    print("=" * 50, flush=True)
    
    return audit_df

if __name__ == "__main__":
    download_subset_images()
