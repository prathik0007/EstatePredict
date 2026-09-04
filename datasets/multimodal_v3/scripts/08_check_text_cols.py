import sys
import pandas as pd
sys.stdout.reconfigure(encoding='utf-8')

def check_text_columns():
    asheville_path = r"C:\Users\prath\.cache\huggingface\hub\datasets--michaelmallari--airbnb-usa-nc-asheville\snapshots\2c16ace1cbeaf3c30c37383fd914b01677d56ab1\20231218-listings-detailed.csv"
    df = pd.read_csv(asheville_path)
    
    print("Total rows:", len(df))
    text_cols = ['name', 'description', 'neighborhood_overview', 'host_about', 'amenities', 'property_type', 'room_type']
    for col in text_cols:
        if col in df.columns:
            non_null = df[col].dropna()
            print(f"Col '{col}': {len(non_null)} / {len(df)} ({len(non_null)/len(df)*100:.2f}%) non-null")
            if len(non_null) > 0:
                print(f"  Sample value: {repr(str(non_null.iloc[0])[:120])}")
                
    # Also check other key columns: accommodates, bathrooms, bedrooms, beds, latitude, longitude
    num_cols = ['accommodates', 'bathrooms', 'bathrooms_text', 'bedrooms', 'beds', 'latitude', 'longitude', 'number_of_reviews', 'review_scores_rating']
    for col in num_cols:
        if col in df.columns:
            non_null = df[col].dropna()
            print(f"Col '{col}': {len(non_null)} / {len(df)} ({len(non_null)/len(df)*100:.2f}%) non-null")
            if len(non_null) > 0:
                print(f"  Sample value: {non_null.iloc[0]}")

if __name__ == "__main__":
    check_text_columns()
