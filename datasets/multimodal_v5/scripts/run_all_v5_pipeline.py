"""
Master Pipeline Orchestrator for Multimodal V5
Executes all phases in strict sequence:
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 ->
Phase 8/9 -> Phase 10 -> Phase 11 -> Phase 12 -> Phase 13 -> Phase 14 -> Phase 15
"""

import os
import sys
import time
import subprocess

SCRIPTS = [
    ("Phase 1: Reproducible Splits", "01_phase1_splits.py"),
    ("Phase 2: Tabular Baselines", "02_phase2_tabular_models.py"),
    ("Phase 3: CLIP Image Representations", "03_phase3_clip_images.py"),
    ("Phase 4: Text Representations Comparison", "04_phase4_text_embeddings.py"),
    ("Phase 5: PCA Ablation", "05_phase5_pca_ablation.py"),
    ("Phase 6: Multi-Image Feasibility Audit", "06_phase6_multi_image_feasibility.py"),
    ("Phase 7: Geographic Feature Engineering", "07_phase7_geographic_features.py"),
    ("Phases 8 & 9: Multimodal Concat & Attention Fusion", "08_phase8_multimodal_concat_and_attention.py"),
    ("Phase 10: Training Volume Sensitivity", "10_phase10_training_volume.py"),
    ("Phase 11: Controlled Master Ablation", "11_phase11_master_ablation.py"),
    ("Phase 12: SHAP Feature Explainability", "12_phase12_shap_analysis.py"),
    ("Phase 13: Distribution-Free Conformal Prediction", "13_phase13_conformal_prediction.py"),
    ("Phase 14: Complete Scientific Leakage Audit", "14_phase14_leakage_audit.py"),
    ("Phase 15: Final Scientific Audit & Reproducibility", "15_phase15_reproducibility.py")
]

SCRIPT_DIR = "datasets/multimodal_v5/scripts"

print("==========================================================")
print("   MULTIMODAL V5: MASTER RESEARCH PIPELINE EXECUTION      ")
print("==========================================================")

total_t0 = time.time()

for step_name, script_file in SCRIPTS:
    script_path = os.path.join(SCRIPT_DIR, script_file)
    print(f"\n>>> Starting {step_name} ({script_file})...", flush=True)
    t0 = time.time()
    res = subprocess.run([sys.executable, script_path], capture_output=False)
    if res.returncode != 0:
        print(f"FATAL ERROR in {step_name} (exit code: {res.returncode})! Aborting pipeline.", flush=True)
        sys.exit(res.returncode)
    elapsed = time.time() - t0
    print(f">>> Completed {step_name} successfully in {elapsed:.1f}s.", flush=True)

total_elapsed = time.time() - total_t0
print("\n==========================================================")
print(f"   MULTIMODAL V5 PIPELINE FULLY COMPLETED IN {total_elapsed/60:.2f} MINS")
print("==========================================================")
