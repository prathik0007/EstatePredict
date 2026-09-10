import os
import sys
import numpy as np
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V4_DIR = os.path.join(ROOT_DIR, "multimodal_v4")
RESULTS_DIR = os.path.join(V4_DIR, "results")
FINAL_ABLATION_CSV = os.path.join(RESULTS_DIR, "final_ablation_table.csv")

def compile_final_ablation():
    print("=" * 70)
    print("PHASE 9: COMPILING FINAL CONTROLLED ABLATION TABLE")
    print("=" * 70)
    
    # Load sub-experiment CSVs
    model_comp_csv = os.path.join(RESULTS_DIR, "model_comparison.csv")
    pca_csv = os.path.join(RESULTS_DIR, "pca_ablation.csv")
    geo_csv = os.path.join(RESULTS_DIR, "geographic_feature_comparison.csv")
    text_csv = os.path.join(RESULTS_DIR, "text_embedding_comparison.csv")
    attn_csv = os.path.join(RESULTS_DIR, "attention_fusion_results.csv")
    size_csv = os.path.join(RESULTS_DIR, "dataset_size_comparison.csv")
    clip_csv = os.path.join(RESULTS_DIR, "clip_comparison.csv")
    
    rows = []
    
    # 1. Tabular Only (V3 Baseline)
    rows.append({
        "Experiment_ID": "EXP-01",
        "Category": "V3 Baseline",
        "Hypothesis_or_Variation": "Tabular Only (23-d)",
        "Model": "HistGradientBoosting (Log1p)",
        "Feature_Dimension": 23,
        "MAE": 74.07,
        "RMSE": 158.64,
        "R2": 0.5318,
        "MAPE": 33.66,
        "MedAE": 34.88,
        "Test_N": 360,
        "Status": "Baseline Established"
    })
    
    # 2. Tabular + Text (V3 Baseline)
    rows.append({
        "Experiment_ID": "EXP-02",
        "Category": "V3 Baseline",
        "Hypothesis_or_Variation": "Tabular + Text (MiniLM PCA 32-d)",
        "Model": "HistGradientBoosting (Log1p)",
        "Feature_Dimension": 55,
        "MAE": 77.58,
        "RMSE": 165.03,
        "R2": 0.4933,
        "MAPE": 35.19,
        "MedAE": 35.88,
        "Test_N": 360,
        "Status": "Degradation vs Tabular"
    })
    
    # 3. Tabular + Image (V3 Baseline)
    rows.append({
        "Experiment_ID": "EXP-03",
        "Category": "V3 Baseline",
        "Hypothesis_or_Variation": "Tabular + Image (EfficientNet PCA 64-d)",
        "Model": "HistGradientBoosting (Log1p)",
        "Feature_Dimension": 87,
        "MAE": 79.59,
        "RMSE": 174.16,
        "R2": 0.4357,
        "MAPE": 33.45,
        "MedAE": 33.55,
        "Test_N": 360,
        "Status": "Degradation vs Tabular"
    })
    
    # 4. Tabular + Text + Image (V3 Full Multimodal)
    rows.append({
        "Experiment_ID": "EXP-04",
        "Category": "V3 Baseline",
        "Hypothesis_or_Variation": "Full Multimodal Concatenation (119-d)",
        "Model": "HistGradientBoosting (Log1p)",
        "Feature_Dimension": 119,
        "MAE": 79.65,
        "RMSE": 174.78,
        "R2": 0.4316,
        "MAPE": 34.17,
        "MedAE": 35.93,
        "Test_N": 360,
        "Status": "Degradation vs Tabular"
    })
    
    # 5. Better Tabular Regressors (from Phase 1)
    if os.path.exists(model_comp_csv):
        df_mc = pd.read_csv(model_comp_csv)
        for idx, r in df_mc.iterrows():
            if "Baseline" not in r["Model"]:
                rows.append({
                    "Experiment_ID": f"EXP-05-{r['Model']}",
                    "Category": "Tabular Regressor Comparison",
                    "Hypothesis_or_Variation": f"Alternative Regressor: {r['Model']}",
                    "Model": f"{r['Model']} (Log1p)",
                    "Feature_Dimension": int(r['Feature_Dim']),
                    "MAE": r['MAE'],
                    "RMSE": r['RMSE'],
                    "R2": r['R2'],
                    "MAPE": r['MAPE'],
                    "MedAE": r['MedAE'],
                    "Test_N": int(r['Test_N']),
                    "Status": "Evaluated"
                })
                
    # 6. PCA Ablation Variations (from Phase 2)
    if os.path.exists(pca_csv):
        df_pca = pd.read_csv(pca_csv)
        for idx, r in df_pca.iterrows():
            if "Existing" not in r["Configuration"]:
                rows.append({
                    "Experiment_ID": f"EXP-06-PCA-{idx}",
                    "Category": "PCA Dimensionality Ablation",
                    "Hypothesis_or_Variation": f"Dimensionality: {r['Configuration']}",
                    "Model": "HistGradientBoosting (Log1p)",
                    "Feature_Dimension": int(r['Total_Train_Dim']),
                    "MAE": r['MAE'],
                    "RMSE": r['RMSE'],
                    "R2": r['R2'],
                    "MAPE": r['MAPE'],
                    "MedAE": r['MedAE'],
                    "Test_N": 360,
                    "Status": "Evaluated"
                })
                
    # 6b. CLIP Multimodal Representations (from Phase 3)
    if os.path.exists(clip_csv):
        df_clip = pd.read_csv(clip_csv)
        for idx, r in df_clip.iterrows():
            if "Tabular Only" not in r["Representation"]:
                rows.append({
                    "Experiment_ID": f"EXP-03-CLIP-{idx}",
                    "Category": "CLIP Multimodal Representation",
                    "Hypothesis_or_Variation": f"{r['Representation']}",
                    "Model": "HistGradientBoosting (Log1p)",
                    "Feature_Dimension": int(r['Feature_Dimension']),
                    "MAE": r['MAE'],
                    "RMSE": r['RMSE'],
                    "R2": r['R2'],
                    "MAPE": r['MAPE'],
                    "MedAE": r['MedAE'],
                    "Test_N": int(r['Test_N']),
                    "Status": "Evaluated"
                })
                
    # 7. Geographic Feature Variations (from Phase 6)
    if os.path.exists(geo_csv):
        df_geo = pd.read_csv(geo_csv)
        for idx, r in df_geo.iterrows():
            if "Baseline" not in r["Model"]:
                rows.append({
                    "Experiment_ID": f"EXP-07-GEO-{idx}",
                    "Category": "Geographic Features",
                    "Hypothesis_or_Variation": f"{r['Model']} + 7 Spatial Distances",
                    "Model": f"{r['Model']} (Log1p)",
                    "Feature_Dimension": int(r['Feature_Dimension']),
                    "MAE": r['MAE'],
                    "RMSE": r['RMSE'],
                    "R2": r['R2'],
                    "MAPE": r['MAPE'],
                    "MedAE": r['MedAE'],
                    "Test_N": int(r['Test_N']),
                    "Status": "Evaluated"
                })
                
    # 8. Better Text Embeddings (from Phase 4)
    if os.path.exists(text_csv):
        df_text = pd.read_csv(text_csv)
        for idx, r in df_text.iterrows():
            if "None" not in r["Text_Embedding"] and "Baseline" not in r["Text_Embedding"]:
                rows.append({
                    "Experiment_ID": f"EXP-08-TEXT-{idx}",
                    "Category": "Text Embedding Comparison",
                    "Hypothesis_or_Variation": f"Tabular + {r['Text_Embedding']}",
                    "Model": f"{r['Model']} (Log1p)",
                    "Feature_Dimension": int(r['Total_Features']),
                    "MAE": r['MAE'],
                    "RMSE": r['RMSE'],
                    "R2": r['R2'],
                    "MAPE": r['MAPE'],
                    "MedAE": r['MedAE'],
                    "Test_N": 360,
                    "Status": "Evaluated"
                })
                
    # 9. Attention-Based Multimodal Fusion (from Phase 7)
    if os.path.exists(attn_csv):
        df_attn = pd.read_csv(attn_csv)
        for idx, r in df_attn.iterrows():
            rows.append({
                "Experiment_ID": f"EXP-09-ATTN-{idx}",
                "Category": "Multimodal Fusion Architecture",
                "Hypothesis_or_Variation": r['Fusion_Architecture'],
                "Model": "PyTorch Neural Architecture",
                "Feature_Dimension": 192,
                "MAE": r['MAE'],
                "RMSE": r['RMSE'],
                "R2": r['R2'],
                "MAPE": r['MAPE'],
                "MedAE": r['MedAE'],
                "Test_N": int(r['Test_N']),
                "Status": "Evaluated"
            })
            
    # 10. Dataset Size Scaling (from Phase 8)
    if os.path.exists(size_csv):
        df_size = pd.read_csv(size_csv)
        for idx, r in df_size.iterrows():
            rows.append({
                "Experiment_ID": f"EXP-10-SIZE-{idx}",
                "Category": "Dataset Cohort Scaling",
                "Hypothesis_or_Variation": f"Scale: {r['Scale_Condition']}",
                "Model": "HistGradientBoosting (Log1p)",
                "Feature_Dimension": 23,
                "MAE": r['MAE'],
                "RMSE": r['RMSE'],
                "R2": r['R2'],
                "MAPE": r['MAPE'],
                "MedAE": r['MedAE'],
                "Test_N": int(r['Test_N']),
                "Status": "Evaluated"
            })
            
    out_df = pd.DataFrame(rows)
    out_df.to_csv(FINAL_ABLATION_CSV, index=False)
    print(f"Final Ablation Table compiled with {len(out_df)} rows.")
    print(f"Saved to: {FINAL_ABLATION_CSV}")
    print(out_df[['Experiment_ID', 'Category', 'Hypothesis_or_Variation', 'MAE', 'R2', 'MAPE', 'MedAE']].to_string(index=False))

if __name__ == "__main__":
    compile_final_ablation()
