import pandas as pd
from sentence_transformers import SentenceTransformer

# Load the preprocessed dataset
df = pd.read_csv("preprocessed_multimodal_dataset.csv")

# Fill missing values and combine text columns
df["Description"] = df["Description"].fillna("")
df["Neighborhood_Overview"] = df["Neighborhood_Overview"].fillna("")
df["Amenities"] = df["Amenities"].fillna("")

df["combined_text"] = (
    df["Description"] + " " +
    df["Neighborhood_Overview"] + " " +
    df["Amenities"]
)

# Load MiniLM model
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating text embeddings...")

# Generate 384-dimensional embeddings
embeddings = model.encode(
    df["combined_text"].tolist(),
    show_progress_bar=True
)

# Convert embeddings to DataFrame
embedding_df = pd.DataFrame(
    embeddings,
    columns=[f"Embedding_{i}" for i in range(embeddings.shape[1])]
)

# Merge with original dataset
final_df = pd.concat([df, embedding_df], axis=1)

# Save the output
final_df.to_csv("text_embeddings_dataset.csv", index=False)

print("Text embeddings generated successfully!")
print("Saved as: text_embeddings_dataset.csv")