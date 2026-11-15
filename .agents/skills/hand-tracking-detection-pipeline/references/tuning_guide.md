# Hand Tracking & Detection Tuning Guide

## 1. Tuning MediaPipe Palm Detection

### A. Understanding the 2,016 Anchors
In `useHandDetection.ts`, the model consumes a `192x192x3` input tensor and outputs two tensors:
- **Regressor Tensor:** Shape `[1, 2016, 18]` (offset `dx, dy, w, h`, plus 7 keypoint coordinates).
- **Classifier Tensor:** Shape `[1, 2016, 1]` (raw logits).

### B. Anchor Grid Stride:
- Layer 1 (24x24 grid, stride 8): 2 anchors per cell = 1,152 anchors (detects smaller, distant palms).
- Layer 2 (12x12 grid, stride 16): 6 anchors per cell = 864 anchors (detects larger, closer palms).

### C. Normalization & Logit Handling:
- The input image MUST be normalized to `[0, 1]`. Normalizing to `[-1, 1]` causes exploding activations where logits shoot past `900.0`.
- Always check if the output logit is pre-activated (`0.0 <= val <= 1.0`). If not, apply `sigmoid(logit)`.

---

## 2. Tuning CamShift Tracking

### A. HSV Filtering Range
In `camShiftTracker.ts`:
- **Brightness Mask:** Ignores pixels with Value $V < 10$ (pitch black) or $V > 98$ with Saturation $S < 5$ (specular glare).
- **Skin Hue Range:** Initial detection looks for hues between $0^\circ \le H \le 35^\circ$ and $325^\circ \le H \le 360^\circ$.
- **Adaptive Blend Rate:** Once acquired, the active target hue is updated:
  $$\text{targetHue} = 0.95 \times \text{targetHue} + 0.05 \times \text{frameAvgHue}$$
  Increasing $0.05$ makes the tracker adapt faster to lighting changes but risks color drift.

### B. Exponential Top-Bias Weighting
To prevent the tracker from sliding down onto the user's arm or shirt:
$$\text{weight} = 1 + \left(\frac{64 - y}{64}\right)^3 \times 20$$
Pixels in the top 30% of the window receive exponentially higher mass, anchoring the center of mass to the fingertips.
