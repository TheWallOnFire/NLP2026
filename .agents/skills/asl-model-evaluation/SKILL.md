---
name: asl-model-evaluation
description: >-
  Use this skill when evaluating, benchmarking, or verifying trained Keras (.keras)
  or TensorFlow Lite (.tflite) models in the NLP2026 project. Covers running the test
  suite, measuring accuracy, generating classification reports, inspecting tensor
  shapes, and testing single images.
---

# ASL Model Evaluation & Benchmarking Skill

This skill provides step-by-step instructions for running benchmarks, verification tests, and accuracy reports across both Keras and TFLite model variants in the NLP2026 repository.

---

## 1. When to Use This Skill
- Verifying whether a newly trained or converted model is functioning properly.
- Checking TFLite input/output tensor shapes and data types.
- Evaluating classification accuracy, precision, recall, and F1-score across validation datasets.
- Diagnosing prediction failures or model output regressions.
- Running headless benchmark suites.

---

## 2. Test Scripts Overview

All testing utilities are located in `tests/`:

| Script | Purpose | Key Arguments |
| :--- | :--- | :--- |
| **`tests/test.py`** | Interactive menu to run any test script. | None (interactive CLI) |
| **`tests/01_test_keras_dataset.py`** | Evaluates a `.keras` model on a full dataset. | `--model`, `--data`, `--batch_size`, `--img_size` |
| **`tests/02_test_keras_center_crop.py`** | Tests center-crop inference on a directory of images. | `--model`, `--data`, `--img_size`, `--save-crops` |
| **`tests/03_test_tflite_shapes.py`** | Inspects input/output tensor dimensions and types. | `--model`, `--pack` |
| **`tests/04_test_tflite_dataset.py`** | Evaluates a `.tflite` model or Model Pack on a dataset. | `--data`, `--model`, `--pack`, `--max_samples` |
| **`tests/05_test_tflite_real.py`** | Tests a `.tflite` model on a single image or sample. | `--model`, `--pack`, `--image` |
| **`tests/06_eval_quick.py`** | Comparative evaluation across multiple Keras models. | `--data`, `--models`, `--split` |

---

## 3. Workflow Procedures

### Procedure A: Fast Sanity Check (Tensor Shapes)
To quickly check that a TFLite file or Model Pack has the right dimensions:
```bash
python tests/03_test_tflite_shapes.py --pack models/packs/ASL_MobileNetV2_Final.zip
```
Expected output:
- Input: `[1, 224, 224, 3]`, dtype: `float32`
- Output: `[1, 29]`, dtype: `float32`

### Procedure B: Single Image Verification
To test inference on a real photo or sample screenshot:
```bash
python tests/05_test_tflite_real.py --pack models/packs/ASL_MobileNetV2_Final.zip --image screenshot/1783750155002_*.jpg
```

### Procedure C: Dataset Accuracy Benchmark
To run an accuracy evaluation against the Kaggle dataset:
```bash
python tests/04_test_tflite_dataset.py --pack models/packs/ASL_MobileNetV2_Final.zip --max_samples 500
```
This generates an accuracy percentage and scikit-learn Classification Report with per-class precision and recall.

### Procedure D: Interactive Testing
For interactive exploration, launch the test menu:
```bash
python tests/test.py
```
Select the corresponding script number from the terminal prompt.
