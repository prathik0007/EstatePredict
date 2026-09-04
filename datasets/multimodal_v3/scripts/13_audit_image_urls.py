import os
import sys
import re
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CSV = os.path.join(BASE_DIR, "raw", "asheville_20231218_raw_listings.csv")

def audit_listing_images():
    print("=" * 70)
    print("AUDIT: AVAILABLE IMAGE URLS PER LISTING IN SOURCE DATASET")
    print("=" * 70)
    
    df = pd.read_csv(RAW_CSV)
    total_listings = len(df)
    print(f"Total listings in raw dataset: {total_listings}")
    
    # 1. Search for all columns containing 'url', 'image', 'picture', 'photo', etc.
    img_related_cols = [c for c in df.columns if any(k in c.lower() for k in ['pic', 'img', 'image', 'photo', 'url', 'thumbnail'])]
    print(f"\nAll URL / Image-related columns found in raw schema ({len(img_related_cols)}):")
    for col in img_related_cols:
        non_null = df[col].dropna()
        sample_val = str(non_null.iloc[0])[:80] if len(non_null) > 0 else "None"
        print(f"  - '{col}': {len(non_null)} non-null | Sample: {sample_val}")
        
    # Classify property-level vs host-level vs web-page URLs:
    # Property images: picture_url, thumbnail_url, medium_url, xl_picture_url
    # Host images: host_thumbnail_url, host_picture_url
    # Listing web links: listing_url, host_url
    
    property_img_cols = [c for c in ['picture_url', 'thumbnail_url', 'medium_url', 'xl_picture_url'] if c in df.columns]
    print(f"\nProperty Image Columns identified: {property_img_cols}")
    
    # Also check if any text/json column contains additional image URLs (e.g. description, amenities)
    def find_all_urls_in_row(row):
        urls = set()
        # Check explicit property image columns
        for c in property_img_cols:
            val = row.get(c, "")
            if pd.notna(val) and str(val).startswith("http"):
                urls.add(str(val).strip())
                
        # Check description/neighborhood for embedded muscache image links
        for c in ['description', 'neighborhood_overview', 'amenities', 'name']:
            val = str(row.get(c, ""))
            # Search for embedded picture URLs if any
            found = re.findall(r'https?://[^\s",\'<>]+\.(?:jpg|jpeg|png|webp)', val)
            for f in found:
                if 'muscache' in f or 'airbnb' in f:
                    urls.add(f)
                    
        return list(urls)
        
    df['distinct_property_image_urls'] = df.apply(find_all_urls_in_row, axis=1)
    df['distinct_property_image_count'] = df['distinct_property_image_urls'].apply(len)
    
    # Count distribution
    c0 = (df['distinct_property_image_count'] == 0).sum()
    c1 = (df['distinct_property_image_count'] == 1).sum()
    c2_3 = ((df['distinct_property_image_count'] >= 2) & (df['distinct_property_image_count'] <= 3)).sum()
    c4_5 = ((df['distinct_property_image_count'] >= 4) & (df['distinct_property_image_count'] <= 5)).sum()
    c_gt5 = (df['distinct_property_image_count'] > 5).sum()
    total_img_urls = df['distinct_property_image_count'].sum()
    
    print("\n" + "=" * 50)
    print("IMAGE URL DISTRIBUTION ACROSS LISTINGS:")
    print("=" * 50)
    print(f"Total Listings                 : {total_listings}")
    print(f"Listings with 0 images         : {c0} ({c0/total_listings*100:.2f}%)")
    print(f"Listings with 1 image          : {c1} ({c1/total_listings*100:.2f}%)")
    print(f"Listings with 2–3 images       : {c2_3} ({c2_3/total_listings*100:.2f}%)")
    print(f"Listings with 4–5 images       : {c4_5} ({c4_5/total_listings*100:.2f}%)")
    print(f"Listings with > 5 images       : {c_gt5} ({c_gt5/total_listings*100:.2f}%)")
    print(f"Total Available Property URLs  : {total_img_urls}")
    print("=" * 50)
    
    # Check if host images exist
    has_host_pic = 'host_picture_url' in df.columns
    if has_host_pic:
        print(f"\nHost Profile Images (separate from property): {df['host_picture_url'].dropna().shape[0]} non-null")
        print("Note: Host profile photos are user avatars, NOT property interior/exterior photos.")
        
    return df

if __name__ == "__main__":
    audit_listing_images()
