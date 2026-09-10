import os
import sys
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V3_COHORT = os.path.join(ROOT_DIR, "multimodal_v3", "processed", "multimodal_cohort.csv")
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
V4_PROCESSED = os.path.join(V4_DIR, "processed")
V4_COHORT = os.path.join(V4_PROCESSED, "v4_cohort.csv")

os.makedirs(V4_PROCESSED, exist_ok=True)

def setup_v4():
    print("Setting up V4 Cohort from authenticated Asheville dataset...")
    df_v3 = pd.read_csv(V3_COHORT)
    assert len(df_v3) == 1800, f"Expected 1800 rows, got {len(df_v3)}"
    assert df_v3['id'].nunique() == 1800, "IDs must be unique"
    
    # Save independent copy for V4
    df_v3.to_csv(V4_COHORT, index=False)
    print(f"V4 cohort saved to {V4_COHORT} with {len(df_v3)} rows and {df_v3['id'].nunique()} unique IDs.")

if __name__ == "__main__":
    setup_v4()
