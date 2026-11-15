# Evaluation Test Suite Reference Guide

Detailed guide for each script in `tests/`:

## 1. `01_test_keras_dataset.py`
- **Goal:** Assesses `.keras` weights directly against a local directory of labeled class folders.
- **Normalization:** Divides pixel arrays by 255.0 to map to `[0, 1]`.
- **Outputs:** Overall Loss, Accuracy %, and full `classification_report`.
- **Typical Usage:**
  ```bash
  python tests/01_test_keras_dataset.py --model models/model/asl_mobilenetv2_final.keras --data data/asl_alphabet_train
  ```

---

## 2. `02_test_keras_center_crop.py`
- **Goal:** Simulates static inference without hand landmark tracking by center-cropping the largest square from raw images.
- **Image Inputs:** Reads any folder containing `.jpg`, `.jpeg`, `.png`, or `.bmp` files.
- **Outputs:** Console table displaying filename, predicted class, and confidence percentage.
- **Typical Usage:**
  ```bash
  python tests/02_test_keras_center_crop.py --data screenshot/ --save-crops
  ```

---

## 3. `03_test_tflite_shapes.py`
- **Goal:** Validates that a `.tflite` model or zipped Model Pack has the expected input/output shapes.
- **Temporary Dir Handling:** Automatically unpacks `assets/model.tflite` to a temporary directory and ensures cleanup.
- **Outputs:** Input name, shape, dtype and Output name, shape, dtype.

---

## 4. `04_test_tflite_dataset.py`
- **Goal:** Simulates on-device TFLite execution on a validation split.
- **Key Parameters:**
  - `--max_samples`: Limits the number of images evaluated to prevent long delays. Default: 500.
  - `--img_size`: Input dimension for resizing. Default: 224.

---

## 5. `05_test_tflite_real.py`
- **Goal:** Single-shot verification of a `.tflite` model on an arbitrary image file.
- **Fallback:** If no image is provided or found, generates a synthetic zero-tensor to ensure the graph compiles and invokes without crashing.

---

## 6. `06_eval_quick.py`
- **Goal:** Side-by-side comparison of multiple Keras models on the same validation split.
- **Default Models:** `asl_mobilenetv2_final.keras` and `mobilenet_best.keras`.
