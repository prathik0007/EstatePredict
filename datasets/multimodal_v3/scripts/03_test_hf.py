from datasets import load_dataset
import pandas as pd

def test_hf():
    print("Testing bstraehle/airbnb-san-francisco-202403-embed...")
    try:
        ds = load_dataset("bstraehle/airbnb-san-francisco-202403-embed", split="train")
        df = ds.to_pandas()
        print(f"Total rows: {len(df)}")
        print("Columns:", list(df.columns))
        print("Sample id:", df['id'].head(3).tolist())
        print("Sample price:", df['price'].head(5).tolist() if 'price' in df.columns else "No price")
        print("Price null count:", df['price'].isna().sum() if 'price' in df.columns else "N/A")
        print("Sample picture_url:", df['picture_url'].head(3).tolist() if 'picture_url' in df.columns else "No picture_url")
        print("Sample description len:", [len(str(x)) for x in df['description'].head(3)] if 'description' in df.columns else "No description")
        return df
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    test_hf()
