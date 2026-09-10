"""
Phase 1: Fixed Reproducible Train/Test and Calibration Splits
Workspace: datasets/multimodal_v5/
Split: 80% Train, 20% Test (Fixed seed = 42).
Within Train, separate a 20% calibration split for Phase 13 Conformal Prediction.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

PROCESSED_CSV = "datasets/multimodal_v5/processed/v5_cohort_listings.csv"
SPLITS_DIR = "datasets/multimodal_v5/splits"
os.makedirs(SPLITS_DIR, exist_ok=True)

print("=== Phase 1: Generating Reproducible Splits ===")

df = pd.read_csv(PROCESSED_CSV)
n_total = len(df)
print(f"Total cohort listings: {n_total}")

# Fixed reproducible split: 80% train, 20% test
train_df, test_df = train_test_split(df, test_size=0.20, random_state=42, shuffle=True)

# For conformal prediction, split train into train_fit (75% of train = 60% of total) and calib (25% of train = 20% of total)
train_fit_df, calib_df = train_test_split(train_df, test_size=0.25, random_state=42, shuffle=True)

print(f"Train split size: {len(train_df)} ({len(train_df)/n_total*100:.1f}%)")
print(f"  - Model fitting subset: {len(train_fit_df)} ({len(train_fit_df)/n_total*100:.1f}%)")
print(f"  - Conformal calibration subset: {len(calib_df)} ({len(calib_df)/n_total*100:.1f}%)")
print(f"Test split size: {len(test_df)} ({len(test_df)/n_total*100:.1f}%)")

# Verify disjointness
train_set = set(train_df['id'])
test_set = set(test_df['id'])
calib_set = set(calib_df['id'])
train_fit_set = set(train_fit_df['id'])

assert len(train_set & test_set) == 0, "FATAL: Train and test sets overlap!"
assert len(train_fit_set & calib_set) == 0, "FATAL: Train_fit and calib sets overlap!"
assert (train_fit_set | calib_set) == train_set, "FATAL: Calibration partition mismatch!"

# Save ID lists
train_df[['id']].to_csv(os.path.join(SPLITS_DIR, "train_ids.csv"), index=False)
test_df[['id']].to_csv(os.path.join(SPLITS_DIR, "test_ids.csv"), index=False)
calib_df[['id']].to_csv(os.path.join(SPLITS_DIR, "calibration_ids.csv"), index=False)
train_fit_df[['id']].to_csv(os.path.join(SPLITS_DIR, "train_fit_ids.csv"), index=False)

print(f"Splits saved to {SPLITS_DIR}/")
print("=== Phase 1 Complete! ===")
