import os
import sys
import subprocess
import time

sys.stdout.reconfigure(encoding='utf-8')

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

def run_step(script_name, description):
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    print("\n" + "=" * 80)
    print(f">>> RUNNING [{script_name}]: {description}")
    print("=" * 80)
    
    t0 = time.time()
    res = subprocess.run([sys.executable, script_path], capture_output=False)
    dur = time.time() - t0
    
    if res.returncode != 0:
        print(f"\n[ERROR] Step {script_name} failed with exit code {res.returncode}")
        sys.exit(res.returncode)
    else:
        print(f"\n[SUCCESS] {script_name} finished in {dur:.1f} seconds.")

def main():
    print("=" * 80)
    print("STARTING MULTIMODAL V3 RESEARCH PIPELINE (ASHEVILLE, NC BENCHMARK)")
    print("=" * 80)
    
    start_total = time.time()
    
    # Run Steps
    run_step("03_preprocess_text_and_tabular.py", "Stage 2 & 3: Preprocess Text & Tabular Features")
    run_step("04_extract_text_embeddings.py", "Stage 4: MiniLM Text Embeddings (384-d)")
    run_step("05_extract_image_embeddings.py", "Stage 5: EfficientNetB0 Image Embeddings (1280-d)")
    run_step("06_run_ablation_benchmark.py", "Stage 6, 7, 8 & 9: Multimodal Ablation Benchmark & Leakage Audit")
    
    total_dur = time.time() - start_total
    print("\n" + "=" * 80)
    print(f"ALL MULTIMODAL V3 EXPERIMENTS COMPLETED IN {total_dur:.1f} SECONDS!")
    print("=" * 80)

if __name__ == "__main__":
    main()
