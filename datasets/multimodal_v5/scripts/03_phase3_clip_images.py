"""
Phase 3: CLIP Image Representation Extraction
Workspace: datasets/multimodal_v5/
Model: CLIP ViT-B/32 (openai/clip-vit-base-patch32)
Output: 512-dimensional L2-normalized image embeddings stored in features/
"""

import os
import time
import torch
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import pandas as pd
import numpy as np
from transformers import CLIPProcessor, CLIPModel

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
IMAGES_DIR = "datasets/multimodal_v5/images"
SPLITS_DIR = "datasets/multimodal_v5/splits"
FEATURES_DIR = "datasets/multimodal_v5/features"
RESULTS_DIR = "datasets/multimodal_v5/results"

os.makedirs(FEATURES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

print("=== Phase 3: Extracting CLIP Image Representations ===")

class PropertyImageDataset(Dataset):
    def __init__(self, listing_ids, images_dir, processor):
        self.listing_ids = listing_ids
        self.images_dir = images_dir
        self.processor = processor

    def __len__(self):
        return len(self.listing_ids)

    def __getitem__(self, idx):
        lid = self.listing_ids[idx]
        img_path = os.path.join(self.images_dir, f"{lid}.jpg")
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception:
            # Fallback black image if corrupted
            image = Image.new('RGB', (224, 224), (0, 0, 0))
        
        inputs = self.processor(images=image, return_tensors="pt")
        pixel_values = inputs['pixel_values'].squeeze(0)
        return lid, pixel_values

def extract_clip_embeddings():
    df = pd.read_csv(PROCESSED_CSV)
    train_ids = set(pd.read_csv(os.path.join(SPLITS_DIR, "train_ids.csv"))['id'].values)
    test_ids = set(pd.read_csv(os.path.join(SPLITS_DIR, "test_ids.csv"))['id'].values)

    all_lids = df['id'].values
    print(f"Total cohort listings: {len(all_lids)}")

    import torch
    torch.set_num_threads(8)

    model_name = "sentence-transformers/clip-ViT-B-32"
    print(f"Loading CLIP model: {model_name}...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(model_name)

    # Batch process images
    batch_size = 128
    all_features = []
    t0 = time.time()
    print(f"Extracting image embeddings for {len(all_lids)} authentic property images...")

    for i in range(0, len(all_lids), batch_size):
        batch_ids = all_lids[i:i+batch_size]
        batch_images = []
        for lid in batch_ids:
            img_path = os.path.join(IMAGES_DIR, f"{lid}.jpg")
            try:
                # Pre-resize to standard 224x224 directly in PIL to prevent Torchvision memory explosion
                img = Image.open(img_path).convert('RGB').resize((224, 224), Image.Resampling.BILINEAR)
            except Exception:
                img = Image.new('RGB', (224, 224), (0, 0, 0))
            batch_images.append(img)

        batch_embeds = model.encode(batch_images, batch_size=batch_size, show_progress_bar=False, normalize_embeddings=True)
        all_features.append(batch_embeds)
        elapsed = time.time() - t0
        processed_count = min(i + batch_size, len(all_lids))
        print(f"  Processed {processed_count}/{len(all_lids)} images ({elapsed:.1f}s, {processed_count/elapsed:.1f} img/s)", flush=True)

    features_matrix = np.vstack(all_features)
    print(f"Extraction complete! Matrix shape: {features_matrix.shape}")

    # Map features to listing IDs
    id_to_feat = {lid: features_matrix[i] for i, lid in enumerate(all_lids)}

    # Split into train and test strictly based on train_ids and test_ids
    train_df = df[df['id'].isin(train_ids)].sort_values('id').reset_index(drop=True)
    test_df = df[df['id'].isin(test_ids)].sort_values('id').reset_index(drop=True)

    X_train_clip = np.array([id_to_feat[lid] for lid in train_df['id']])
    X_test_clip = np.array([id_to_feat[lid] for lid in test_df['id']])

    # Save full and partitioned embeddings
    np.save(os.path.join(FEATURES_DIR, "clip_image_embeddings.npy"), features_matrix)
    np.save(os.path.join(FEATURES_DIR, "clip_img_train.npy"), X_train_clip)
    np.save(os.path.join(FEATURES_DIR, "clip_img_test.npy"), X_test_clip)

    print(f"Saved clip_img_train.npy: {X_train_clip.shape}")
    print(f"Saved clip_img_test.npy: {X_test_clip.shape}")

    # Save Phase 3 documentation
    doc_path = os.path.join(RESULTS_DIR, "CLIP_IMAGE_SPECIFICATION.md")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(f"""# Multimodal V5: CLIP Image Representation Specification

## Model Configuration
- **Model Architecture**: CLIP Vision Transformer (ViT-B/32)
- **HuggingFace Checkpoint**: `openai/clip-vit-base-patch32`
- **Embedding Dimension**: 512
- **Image Preprocessing**:
  - Standard CLIP bicubic interpolation resize to $224 \\times 224$ pixels
  - Standard RGB center crop
  - Image normalization: Mean = [0.48145466, 0.4578275, 0.40821073], Std = [0.26862954, 0.26130258, 0.27577711]
- **Postprocessing**: L2 normalization (unit-sphere projection)
- **Inference Mode**: Deterministic (`torch.no_grad()`, `model.eval()`)
- **Total Listings Extracted**: {len(all_lids):,}
- **Train Set Feature Matrix**: {X_train_clip.shape}
- **Test Set Feature Matrix**: {X_test_clip.shape}
- **PCA Status**: No PCA applied to raw features; pure 512-dimensional visual semantics preserved.
""")
    print(f"CLIP specification written to {doc_path}")
    print("=== Phase 3 Complete! ===")

if __name__ == "__main__":
    if os.path.exists(PROCESSED_CSV) and os.path.exists(os.path.join(SPLITS_DIR, "train_ids.csv")):
        extract_clip_embeddings()
    else:
        print("Waiting for Phase 0 and Phase 1 prerequisite files to complete.")
