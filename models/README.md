# AI Models & Packaging System

This directory manages the training notebooks, Keras weights, preprocessing utilities, and TFLite model pack generators for the NLP2026 Sign Language Recognition system.

---

## 📁 Directory Structure

```text
models/
├── model/                     # Trained weights & archives (.keras, model.zip)
├── notebook/                  # Jupyter notebooks for model experiments & training
├── crop.py                    # Interactive image crop utility (Tkinter GUI)
├── generator.py               # Converter from Keras to optimized TFLite Model Packs
├── packs/                     # Generated .zip Model Packs for deployment
└── README.md                  # This documentation
```

---

## ⚙️ Model Configurations

Model specifications (input dimensions, normalization, vocabulary mappings, descriptions) are maintained centrally in `configs/models_config.json`:

1. **ASL_MobileNetV2_Final** (`asl_mobilenetv2_final.keras`)
   - **Architecture:** MobileNetV2 with custom dense classification head
   - **Input Shape:** `[1, 224, 224, 3]`
   - **Normalization:** `[0, 1]` (pixels divided by 255.0)
   - **Vocabulary:** 29 classes (A-Z, del, nothing, space)

2. **ASL_Best_Model** (`mobilenet_best.keras`)
   - **Architecture:** Lightweight CNN / MobileNet variant
   - **Input Shape:** `[1, 224, 224, 3]`
   - **Normalization:** `[0, 1]`

3. **ASL_EfficientNetB0_Finetuned** (`asl_efficientnetb0_finetuned.keras`)
   - **Architecture:** EfficientNetB0 fine-tuned on ASL Alphabet
   - **Input Shape:** `[1, 224, 224, 3]`
   - **Normalization:** `[0, 255]`

---

## 🚀 Converting & Packaging Model Packs

To convert `.keras` weights into deployable `.tflite` Model Packs:

```bash
# Generate all packs configured in configs/models_config.json
python models/generator.py

# Generate only a specific pack
python models/generator.py --pack-name ASL_MobileNetV2_Final
```

Each generated `.zip` pack contains:
- `assets/model.tflite` — Quantized/optimized TFLite graph
- `assets/metadata.json` — Input shape, normalization, and author metadata
- `assets/vocabulary/word_list.json` — Class index to label mapping
- `assets/vocabulary/word_images/` — Reference sign gesture illustrations
- `README.md` — Human-readable documentation for the pack

The resulting `.zip` files can be imported directly into the mobile app via **Settings > Import Model Pack**.

---

## 🖼️ Preprocessing & Cropping Utility

To quickly crop sample images manually:

```bash
python models/crop.py
```
This launches a lightweight Tkinter GUI to draw bounding boxes and export crops.
