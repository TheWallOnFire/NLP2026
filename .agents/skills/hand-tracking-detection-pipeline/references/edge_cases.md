# Vision Pipeline Edge Cases & Troubleshooting

## 1. Fist Drop (Tracking Lost on Fist Sign)
- **Symptom:** When the user curls their hand into a fist (signs for 'A', 'S', 'E', 'M', 'N', 'T'), the bounding box suddenly disappears.
- **Cause:** Palm detection models expect an open palm; curled fingers reduce palm surface area and drop detection confidence.
- **Fix:** Hysteresis thresholding in `useHandDetection.ts`. While initial lock-on requires `conf > 0.65`, keeping track once locked requires only `conf > 0.20`. Furthermore, `camShiftTracker.ts` relaxes minimum mass to 20 pixels.

---

## 2. Exploding Activations / Ghost Detection
- **Symptom:** Bounding box locks onto random objects or empty background with absurdly high logits (e.g. 922.0).
- **Cause:** 
  1. Input color normalization mismatch (e.g. `[-1, 1]` instead of `[0, 1]`).
  2. JSI ArrayBuffer sharing reading from `byteOffset = 0` and treating Regressors as Classifiers.
- **Fix:** In `useHandDetection.ts`, use typed array views with explicit byte offset:
  ```typescript
  new Float32Array(view.buffer, view.byteOffset, view.byteLength / 4);
  ```

---

## 3. Boundary Clipping & ImageManipulator Crash
- **Symptom:** Moving hand to the far right or bottom edge causes app crash in `ImageManipulator.manipulateAsync`.
- **Cause:** `originX + width > imgW` or `originY + height > imgH`.
- **Fix:** Boundary clamping in `useAutoDetection.ts`:
  ```typescript
  if (newRawX < 0) newRawX = 0;
  if (newRawY < 0) newRawY = 0;
  if (newRawX + side > imgW) newRawX = imgW - side;
  if (newRawY + side > imgH) newRawY = imgH - side;
  ```
