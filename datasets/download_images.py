import os
import pandas as pd
import requests

# Load dataset
df = pd.read_csv("text_embeddings_dataset.csv")

# Create images folder
os.makedirs("images", exist_ok=True)

for index, row in df.iterrows():
    url = row["Picture_URL"]

    if pd.isna(url) or url == "":
        continue

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            with open(f"images/image_{index}.jpg", "wb") as f:
                f.write(response.content)

            print(f"Downloaded Image {index}")

    except Exception as e:
        print(f"Failed {index}: {e}")

print("Download Completed")