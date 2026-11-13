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
    "a wide-angle real estate photo of a house exterior, residential building, or home facade",
    "a wide-angle real estate photo of an apartment building, condominium, or residential property",
    "a real estate interior photo of an entire living room with sofa, seating, and living space",
    "a real estate interior photo of an entire furnished bedroom with bed and furniture",
    "a real estate interior photo of a complete residential kitchen showing cabinets, countertops, and appliances",
    "a real estate interior photo of a complete bathroom with shower, bathtub, or vanity",
    "a wide-angle real estate photo of a luxury villa, estate, cottage, or townhouse property",
    "a wide-angle real estate photo of a residential balcony, terrace, patio, or property backyard"
]

NON_PROPERTY_CATEGORIES = [
    ("Dish / Bowl / Utensil", [
        "a photo of a bowl, ceramic bowl, soup bowl, plate, dish, or saucer",
        "a photo of a bowl with a spoon, cereal, soup, broth, or food inside",
        "a photo of kitchen tableware, dishware, cutlery, spoon, fork, knife, cup, or mug",
        "a close-up photo of a bowl or plate on a table",
        "a photo of cookware, pot, pan, or kitchen utensil"
    ]),
    ("Food / Meal", [
        "a photo of food, cooked meal, fruit, vegetable, dessert, snack, or beverage",
        "a close-up photo of food, breakfast, lunch, dinner, or drinks on a table",
        "a photo of a recipe, dish, or ingredients"
    ]),
    ("Plant / Flower", [
        "a photo of a plant, flower, tree, leaf, houseplant, or garden blossom",
        "a photo of a potted plant, floral bouquet, or green foliage",
        "a close-up photo of flowers, petals, or garden plants"
    ]),
    ("Animal / Pet", [
        "a photo of an animal, dog, cat, puppy, kitten, bird, wildlife, or pet",
        "a photo of a dog or cat indoors or outdoors",
        "a photo of an animal or insect in nature"
    ]),
    ("Person / Face", [
        "a photo of a human face, person, portrait, selfie, or people",
        "a photo of a man, woman, or child standing or sitting"
    ]),
    ("Vehicle", [
        "a photo of a car, automobile, truck, motorcycle, bicycle, scooter, or bus",
        "a photo of a vehicle on a road, street, or parking lot"
    ]),
    ("Object / Everyday Item", [
        "a close-up photo of an isolated object, shoe, clothes, bag, bottle, or item",
        "a photo of electronics, smartphone, laptop, gadget, watch, or hardware tool",
        "an isolated product photograph of a single object or merchandise"
    ]),
    ("Graphic / Text", [
        "a screenshot, digital graphic, meme, cartoon, illustration, logo, or document",
        "a chart, diagram, poster, banner, or drawing"
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
        
        npz_path = Path(__file__).resolve().parent / "prompt_embeddings.npz"
        if npz_path.exists():
            try:
                data = np.load(str(npz_path), allow_pickle=True)
                _prop_embs = data["prop_embs"]
                num_cats = int(data["num_cats"])
                _non_prop_embs_list = [
                    (str(data[f"cat_name_{i}"]), data[f"cat_{i}"])
                    for i in range(num_cats)
                ]
            except Exception:
                _prop_embs = None
                _non_prop_embs_list = None

        if _prop_embs is None or _non_prop_embs_list is None:
            _prop_embs = _model.encode(PROPERTY_PROMPTS, normalize_embeddings=True, show_progress_bar=False)
            _non_prop_embs_list = [
                (cat, _model.encode(prompts, normalize_embeddings=True, show_progress_bar=False))
                for cat, prompts in NON_PROPERTY_CATEGORIES
            ]
    return _model, _prop_embs, _non_prop_embs_list

def classify_image(image_input):
    """
    Classifies an image as residential property or non-property.
    image_input can be a local file path, URL, file-like object, or PIL Image.
    """
    model, prop_embs, non_prop_embs_list = get_classifier()

    if isinstance(image_input, (str, Path)):
        path_str = str(image_input).strip()
        if path_str.startswith("http://") or path_str.startswith("https://"):
            import io
            import urllib.request
            req = urllib.request.Request(path_str, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as resp:
                img = Image.open(io.BytesIO(resp.read())).convert("RGB")
        else:
            img = Image.open(path_str).convert("RGB")
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

    # Property must clearly exceed non-property score with margin and meet confidence threshold
    is_property = bool(p_sim > (best_np_sim + 0.015) and p_sim >= 0.22)

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

