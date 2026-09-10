# Multimodal V5: CLIP Image Representation Specification

## Model Configuration
- **Model Architecture**: CLIP Vision Transformer (ViT-B/32)
- **Exact Model Checkpoint**: `sentence-transformers/clip-ViT-B-32`
- **Library**: `sentence-transformers` (PyTorch backend)
- **Embedding Dimension**: 512
- **Image Preprocessing**:
  - RGB format loading via PIL
  - Bilinear interpolation resize to $224 \times 224$ pixels
  - Standard CLIP normalization: Mean = [0.48145466, 0.4578275, 0.40821073], Std = [0.26862954, 0.26130258, 0.27577711]
- **Postprocessing & Normalization**: Unit-sphere L2 normalization (`normalize_embeddings=True`)
- **Inference Mode**: Deterministic (`torch.no_grad()`, `model.eval()`)
- **Total Listings Extracted**: 5,050
- **Train Set Feature Matrix**: (4040, 512)
- **Test Set Feature Matrix**: (1010, 512)
- **PCA Status**: No PCA applied to raw features; pure 512-dimensional visual semantics preserved.
