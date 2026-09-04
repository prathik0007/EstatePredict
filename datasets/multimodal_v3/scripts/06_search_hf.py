import json
import pandas as pd
from huggingface_hub import hf_hub_download, HfApi

def inspect_datasets():
    api = HfApi()
    print("Searching Hugging Face for airbnb datasets...")
    datasets = api.list_datasets(search="airbnb", limit=20)
    for d in datasets:
        print(f" - {d.id}")

if __name__ == "__main__":
    inspect_datasets()
