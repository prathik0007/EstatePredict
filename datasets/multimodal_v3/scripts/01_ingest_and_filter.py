import shutil
import os
import pandas as pd

def copy_raw_and_filter():
    src_path = r"C:\Users\prath\.cache\huggingface\hub\datasets--michaelmallari--airbnb-usa-nc-asheville\snapshots\2c16ace1cbeaf3c30c37383fd914b01677d56ab1\20231218-listings-detailed.csv"
    dest_raw = r"c:\Prathik\MY DOCUMENTS\Rental_price_prediction\datasets\multimodal_v3\raw\asheville_20231218_raw_listings.csv"
    
    print("Copying raw dataset to datasets/multimodal_v3/raw/...")
    shutil.copyfile(src_path, dest_raw)
    print(f"Copied raw dataset ({os.path.getsize(dest_raw)} bytes).")
    
    # Audit raw file
    df_raw = pd.read_csv(dest_raw)
    print(f"Total raw listings: {len(df_raw)}")
    
    # Check valid price
    df_valid_price = df_raw[df_raw['price'].notna() & (df_raw['price'] != "")].copy()
    print(f"Listings with valid price: {len(df_valid_price)}")
    
    # Check valid picture_url
    df_valid_pic = df_valid_price[df_valid_price['picture_url'].notna() & (df_valid_price['picture_url'] != "")].copy()
    print(f"Listings with valid image URL: {len(df_valid_pic)}")
    
    # Check valid text (name + neighborhood/host info)
    df_valid_text = df_valid_pic[df_valid_pic['name'].notna() & (df_valid_pic['name'] != "")].copy()
    print(f"Listings with valid text: {len(df_valid_text)}")
    
    print(f"Candidate listings ready for image verification: {len(df_valid_text)}")

if __name__ == "__main__":
    copy_raw_and_filter()
