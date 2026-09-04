import os
import sys
import numpy as np
import pandas as pd
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COHORT_CSV = os.path.join(BASE_DIR, "processed", "multimodal_cohort.csv")
FEATURES_DIR = os.path.join(BASE_DIR, "features")
IMAGE_EMB_NPY = os.path.join(FEATURES_DIR, "image_embeddings.npy")
IMAGE_IDS_CSV = os.path.join(FEATURES_DIR, "image_ids.csv")

os.makedirs(FEATURES_DIR, exist_ok=True)

def extract_image_features(batch_size=32):
    print("=" * 70)
    print("STAGE 5: EfficientNetB0 (Keras) IMAGE FEATURE EXTRACTION")
    print("=" * 70)
    
    if not os.path.exists(COHORT_CSV):
        print(f"Error: {COHORT_CSV} not found.")
        return
        
    df = pd.read_csv(COHORT_CSV)
    print(f"Loaded cohort: {len(df)} listings")
    
    print("Loading EfficientNetB0 (ImageNet weights, include_top=False, pooling='avg')...")
    model = EfficientNetB0(weights="imagenet", include_top=False, pooling="avg")
    
    img_paths = df['image_path'].tolist()
    total = len(img_paths)
    all_features = []
    
    print(f"Extracting features for {total} images in batches of {batch_size}...")
    for i in range(0, total, batch_size):
        batch_paths = img_paths[i:i+batch_size]
        batch_imgs = []
        for p in batch_paths:
            try:
                img = Image.open(p).convert('RGB').resize((224, 224))
                arr = np.array(img, dtype=np.float32)
                batch_imgs.append(arr)
            except Exception as e:
                print(f"Warning loading {p}: {e}")
                batch_imgs.append(np.zeros((224, 224, 3), dtype=np.float32))
                
        batch_array = np.array(batch_imgs)
        batch_preprocessed = preprocess_input(batch_array)
        batch_feats = model.predict(batch_preprocessed, verbose=0)
        all_features.append(batch_feats)
        
        if (i // batch_size) % 10 == 0 or (i + batch_size >= total):
            print(f"Processed [{min(i + batch_size, total)}/{total}] images...")
            
    feature_matrix = np.vstack(all_features).astype(np.float32)
    print(f"\nExtracted Image Feature Matrix Shape: {feature_matrix.shape}")
    print(f"Checking nulls / NaNs in features: {np.isnan(feature_matrix).sum()}")
    
    # Save features and IDs
    np.save(IMAGE_EMB_NPY, feature_matrix)
    df[['id']].to_csv(IMAGE_IDS_CSV, index=False)
    
    print(f"Saved image embeddings to {IMAGE_EMB_NPY}")
    print(f"Saved image ID mapping to {IMAGE_IDS_CSV}")

if __name__ == "__main__":
    extract_image_features()
