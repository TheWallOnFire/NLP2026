---
name: hand-tracking-detection-pipeline
description: >-
  Use this skill when developing, debugging, tuning, or modifying the real-time hand
  detection and tracking pipeline in the NLP2026 app. Covers MediaPipe Palm Detection SSD
  decoding, CamShift skin-color tracking, coordinate mapping, Reanimated Spring UI rendering,
  and ASL classification inference.
---

# Hand Tracking & Detection Pipeline Skill

This skill guides AI agents through the inner workings, tuning parameters, and debugging strategies of the real-time hand tracking and sign recognition pipeline in `src/src/features/detection/`.

---

## 1. When to Use This Skill
- Tuning hand detection sensitivity, confidence thresholds, or anchor decoding logic.
- Debugging CamShift tracker issues (e.g. tracking lost when making a fist, tracker latching onto background).
- Fixing coordinate mapping between raw camera sensor frames and on-screen bounding boxes.
- Optimizing frame rates (FPS) and CPU/GPU memory usage during live scanning.
- Investigating detection anomalies like exploding logits, ghost detections, or bounding box jitter.

---

## 2. Pipeline Architecture

The pipeline consists of two concurrent loops managed by `useAutoDetection.ts`:

```text
1. TRACKING LOOP (10-15 FPS, JS Thread + Reanimated)
   ├── SEARCHING State:
   │   └── useHandDetection.ts -> MediaPipe Palm SSD 192x192 (2,016 anchors)
   │       └── If Conf > 0.65 -> Switch to TRACKING State
   └── TRACKING State:
       └── camShiftTracker.ts -> HSV Skin-Color Tracking + Adaptive Hue
           ├── Top-bias exponential weighting (pins to palm/fingers)
           ├── Hysteresis threshold (0.20 to maintain lock on closed fist)
           └── If out-of-bounds -> Reset to SEARCHING State

2. RECOGNITION LOOP (1-2 FPS, Background C++ Thread)
   ├── Square-crop 224x224 enclosing hand via ImageManipulator
   ├── Convert to Float32Array [0, 1] via imageProcessor.ts
   ├── await tfliteModel.run() via useSignLanguageModel.ts
   └── parseInferenceOutput.ts -> Class label + TTS + History log
```

---

## 3. Core Tuning Parameters

| Parameter | Location | Default | Impact & Purpose |
| :--- | :--- | :---: | :--- |
| `DYNAMIC_THRESHOLD` | `useHandDetection.ts` | `0.65` / `0.20` | Detection confidence needed to lock on (`0.65`) vs keep tracking when hand closes (`0.20`). |
| `PADDING_RATIO` | `useAutoDetection.ts` | `0.05` | Extra padding added around palm coordinates to encompass extended fingers. |
| `SCALE_FACTOR` | `useAutoDetection.ts` | `2.0` | Expansion multiplier applied to palm width/height to make a square bounding box. |
| `EDGE_MARGIN` | `useAutoDetection.ts` | `10px` | Distance from camera edge before tracking is abandoned as out-of-bounds. |
| `FRAME_THROTTLE_MS` | `useAutoDetection.ts` | `100ms` | Throttle time between consecutive tracking passes (targets 10 FPS). |
| `Spring Physics` | `AutoModeBoundingBox.tsx` | `d:15, s:120, m:0.8` | Damping, stiffness, and mass for the Reanimated `withSpring` tracking animation. |

See [tuning_guide.md](./references/tuning_guide.md) for in-depth adjustment guidelines and [edge_cases.md](./references/edge_cases.md) for troubleshooting known edge cases.
