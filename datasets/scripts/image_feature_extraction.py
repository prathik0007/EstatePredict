import os
import numpy as np
import pandas as pd

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing import image

# Load EfficientNetB0 without classification layer
model = EfficientNetB0(
    weights="imagenet",
    include_top=False,
    pooling="avg"
)

image_folder = "images"

features = []
image_names = []

print("Extracting image features...")

for img_name in os.listdir(image_folder):

    img_path = os.path.join(image_folder, img_name)

    try:
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)

        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        feature = model.predict(img_array, verbose=0)

        features.append(feature.flatten())
        image_names.append(img_name)

        print(f"Processed: {img_name}")

    except Exception as e:
        print(f"Error: {img_name} -> {e}")

# Convert to DataFrame
feature_df = pd.DataFrame(
    features,
    columns=[f"Image_Feature_{i}" for i in range(len(features[0]))]
)

feature_df.insert(0, "Image_Name", image_names)

feature_df.to_csv("image_features.csv", index=False)

print("Done!")
print("Saved as image_features.csv")