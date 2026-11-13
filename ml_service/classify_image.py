"""
Standalone Image Classifier for EstatePredict: Property vs Non-Property Detection.
Uses CLIP ViT-B/32 zero-shot classification to verify whether an uploaded image
is an authentic residential property (house, apartment, room, villa, interior/exterior)
or an unrelated object (plant, flower, animal, person, food, vehicle, etc.).
"""

import os
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
import sys
import json
import logging
from pathlib import Path
from PIL import Image
import numpy as np

# Suppress external library warnings
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

PROPERTY_PROMPTS = [
    "a photo of a house exterior",
    "a photo of an apartment building",
    "a photo of a residential living room",
    "a photo of a bedroom in a home",
    "a photo of a kitchen in a house",
    "a photo of a bathroom in an apartment",
    "a photo of a villa, cottage, or townhouse",
    "a photo of a real estate property interior, patio, or balcony"
]

NON_PROPERTY_CATEGORIES = [
    ("Plant / Flower", [
        "a photo of a plant, flower, tree, leaf, or garden blossom",
        "a photo of a houseplant or floral arrangement",
        "a close-up photo of flowers or green leaves"
    ]),
    ("Animal / Pet", [
        "a photo of an animal, dog, cat, puppy, kitten, bird, wildlife, or pet",
        "a photo of an animal or insect in nature"
    ]),
    ("Person / Face", [
        "a photo of a human face, person, portrait, selfie, or people",
        "a photo of a person standing or sitting"
    ]),
    ("Food / Dish", [
        "a photo of food, cooked meal, fruit, vegetable, dessert, or beverage"
    ]),
    ("Vehicle", [
        "a photo of a car, automobile, truck, motorcycle, bicycle, or bus"
    ]),
    ("Object / Appliance", [
        "a photo of an isolated object, shoe, clothes, electronics, phone, laptop, or tool"
    ]),
    ("Graphic / Text", [
        "a screenshot, digital graphic, meme, cartoon, illustration, or text document"
    ])
]

_model = None
_prop_embs = None
_non_prop_embs_list = None

def get_classifier():
    global _model, _prop_embs, _non_prop_embs_list
    if _model is None:
        from sentence_transformers import SentenceTransformer
        try:
            _model = SentenceTransformer("sentence-transformers/clip-ViT-B-32", local_files_only=True)
        except Exception:
            _model = SentenceTransformer("sentence-transformers/clip-ViT-B-32")
        
        _prop_embs = _model.encode(PROPERTY_PROMPTS, normalize_embeddings=True, show_progress_bar=False)
        _non_prop_embs_list = [
            (cat, _model.encode(prompts, normalize_embeddings=True, show_progress_bar=False))
            for cat, prompts in NON_PROPERTY_CATEGORIES
        ]
    return _model, _prop_embs, _non_prop_embs_list

def classify_image(image_input):
    """
    Classifies an image as residential property or non-property.
    image_input can be a file path, file-like object, or PIL Image.
    """
    model, prop_embs, non_prop_embs_list = get_classifier()

    if isinstance(image_input, (str, Path)):
        img = Image.open(str(image_input)).convert("RGB")
    elif hasattr(image_input, "seek"):
        image_input.seek(0)
        img = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    else:
        raise ValueError("Unsupported image input type")

    img_emb = model.encode([img], normalize_embeddings=True, show_progress_bar=False)[0]
    p_sim = float(np.max(np.dot(prop_embs, img_emb)))

    best_np_sim = -1.0
    best_cat = "Non-Property"
    for cat_name, embs in non_prop_embs_list:
        sim = float(np.max(np.dot(embs, img_emb)))
        if sim > best_np_sim:
            best_np_sim = sim
            best_cat = cat_name

    # Must have higher similarity to property prompts AND meet baseline threshold
    is_property = bool(p_sim > best_np_sim and p_sim >= 0.20)

    return {
        "is_property": is_property,
        "property_score": round(p_sim, 4),
        "non_property_score": round(best_np_sim, 4),
        "detected_type": "Residential Property" if is_property else best_cat
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(json.dumps({"error": f"Image file not found: {img_path}"}))
        sys.exit(1)

    try:
        res = classify_image(img_path)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e), "is_property": False, "detected_type": "Unknown"}))
        sys.exit(1)

