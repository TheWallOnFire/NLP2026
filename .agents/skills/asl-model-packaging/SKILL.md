---
name: asl-model-packaging
description: >-
  Use this skill when converting, quantizing, or packaging Keras deep learning models
  into deployable TensorFlow Lite (.tflite) Model Packs (.zip) for the NLP2026 Sign Language
  Detector app. Also use when adding new sign language vocabularies, inspecting model configs,
  or generating mobile-ready model bundles.
---

# ASL Model Packaging & TFLite Conversion Skill

This skill guides AI agents through converting trained Keras models into mobile-optimized TensorFlow Lite (TFLite) Model Packs (`.zip`) compatible with the NLP2026 mobile app.

---

## 1. When to Use This Skill
- Adding a new sign language model architecture (e.g. MobileNetV3, ResNet, EfficientNet) to the project.
- Converting `.keras` weights to `.tflite` with standard or quantization optimizations.
- Generating deployable `.zip` Model Packs containing vocabulary mappings, metadata, and gesture illustrations.
- Updating vocabulary classes or label mappings in `configs/models_config.json`.

---

## 2. Model Pack Specification

A valid Model Pack is a standard `.zip` file with the following required internal layout:

```text
<pack_name>.zip
├── assets/
│   ├── model.tflite                # Optimized TensorFlow Lite model binary
│   ├── metadata.json               # Model metadata (id, input shape, normalization, etc.)
│   └── vocabulary/
│       ├── word_list.json          # Index-to-word JSON mapping (e.g., {"0": "A", "1": "B"})
│       └── word_images/            # (Optional) PNG demonstration images ({word}.png)
└── README.md                       # Pack summary and vocabulary index
```

See [spec.md](./references/spec.md) for full schema definitions of `metadata.json` and `word_list.json`.

---

## 3. Workflow Steps

### Step 1: Configure the Model in `configs/models_config.json`
Add or update the model entry. For example:
```json
{
  "keras_file": "asl_mobilenetv2_final.keras",
  "pack_name": "ASL_MobileNetV2_Final",
  "id": "asl_mobilenetv2_final_001",
  "version": "1.0.0",
  "author": "AI Developer Team",
  "language": "en-US",
  "input_shape": [1, 224, 224, 3],
  "normalization": "[0, 1]",
  "description": "MobileNetV2 ASL recognition model (29 classes).",
  "word_image_url": "models/demo/{word}/demo_image.jpg",
  "words": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "del", "nothing", "space"]
}
```

### Step 2: Ensure Weights Exist
Check that the `.keras` file exists in `models/model/`.
- If missing, check if `models/model/model.zip` exists. `models/generator.py` will automatically extract `.keras` files from `model.zip`.

### Step 3: Run the Model Generator
Execute the packaging script from the repository root:
```bash
# Build all packs defined in configs/models_config.json
python models/generator.py

# Or build only a specific pack
python models/generator.py --pack-name ASL_MobileNetV2_Final
```

### Step 4: Validate the Pack
Inspect the generated archive in `models/packs/<pack_name>.zip`:
```bash
python tests/03_test_tflite_shapes.py --pack models/packs/ASL_MobileNetV2_Final.zip
```
Ensure that:
1. `model.tflite` input tensor matches `input_shape` (e.g. `[1, 224, 224, 3]`).
2. Output tensor matches `[1, num_classes]` (e.g. `[1, 29]`).
3. Normalization type is correctly annotated (`[0, 1]`, `[-1, 1]`, or `[0, 255]`).

---

## 4. Normalization Guidelines
- **`[0, 1]`**: Input pixels divided by 255.0. Default for custom MobileNetV2 and MediaPipe models.
- **`[-1, 1]`**: `(pixel / 127.5) - 1.0`. Standard Keras MobileNet default.
- **`[0, 255]`**: Raw unscaled float representation. Default for Keras EfficientNet models with built-in preprocessing layers.
