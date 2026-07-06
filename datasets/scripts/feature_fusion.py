import pandas as pd

# Load datasets
text_df = pd.read_csv("text_embeddings_dataset.csv")
image_df = pd.read_csv("image_features.csv")

# Remove Image_Name column (not needed for training)
if "Image_Name" in image_df.columns:
    image_df = image_df.drop(columns=["Image_Name"])

# Check if both datasets have the same number of rows
min_rows = min(len(text_df), len(image_df))

print(f"Text rows : {len(text_df)}")
print(f"Image rows: {len(image_df)}")
print(f"Using first {min_rows} rows for fusion.")

# Keep only matching rows
text_df = text_df.iloc[:min_rows].reset_index(drop=True)
image_df = image_df.iloc[:min_rows].reset_index(drop=True)

# Merge side-by-side
final_df = pd.concat([text_df, image_df], axis=1)

# Save final dataset
final_df.to_csv("final_feature_dataset.csv", index=False)

print("Feature Fusion Completed Successfully!")
print("Saved as: final_feature_dataset.csv")