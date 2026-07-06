import pandas as pd

# Load the fused dataset
df = pd.read_csv("final_feature_dataset.csv")

# Remove text columns and URL columns
columns_to_remove = [
    "Description",
    "Neighborhood_Overview",
    "Picture_URL",
    "Amenities",
    "combined_text"
]

df = df.drop(columns=columns_to_remove)

# Save cleaned dataset
df.to_csv("training_dataset.csv", index=False)

print("Training dataset created successfully!")
print("Saved as training_dataset.csv")