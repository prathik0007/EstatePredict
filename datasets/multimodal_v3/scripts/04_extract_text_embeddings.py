import os
import sys
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COHORT_CSV = os.path.join(BASE_DIR, "processed", "multimodal_cohort.csv")
FEATURES_DIR = os.path.join(BASE_DIR, "features")
TEXT_EMB_NPY = os.path.join(FEATURES_DIR, "text_embeddings.npy")
TEXT_IDS_CSV = os.path.join(FEATURES_DIR, "text_ids.csv")

os.makedirs(FEATURES_DIR, exist_ok=True)

def extract_text_features(batch_size=64):
    print("=" * 70)
    print("STAGE 4: MiniLM-L6-v2 TEXT EMBEDDING EXTRACTION")
    print("=" * 70)
    
    if not os.path.exists(COHORT_CSV):
        print(f"Error: {COHORT_CSV} not found.")
        return
        
    df = pd.read_csv(COHORT_CSV)
    print(f"Loaded cohort: {len(df)} listings")
    
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"Loading SentenceTransformer model: {model_name}...")
    model = SentenceTransformer(model_name)
    
    texts = df['combined_text'].tolist()
    print(f"Encoding {len(texts)} texts in batches of {batch_size}...")
    
    embeddings = model.encode(texts, batch_size=batch_size, show_progress_bar=True, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype=np.float32)
    
    print(f"\nExtracted Text Embeddings Shape: {embeddings.shape}")
    print(f"Checking nulls / NaNs in embeddings: {np.isnan(embeddings).sum()}")
    
    # Save embeddings and IDs
    np.save(TEXT_EMB_NPY, embeddings)
    df[['id']].to_csv(TEXT_IDS_CSV, index=False)
    
    print(f"Saved text embeddings to {TEXT_EMB_NPY}")
    print(f"Saved text ID mapping to {TEXT_IDS_CSV}")

if __name__ == "__main__":
    extract_text_features()
