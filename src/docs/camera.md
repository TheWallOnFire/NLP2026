# Camera Architecture & Hardware Optimization

This document outlines the camera hardware integration, frame processing pipeline, and lifecycle safety measures implemented with `react-native-vision-camera`.

---

## 1. Native Camera Engine: `react-native-vision-camera` (v5)

The application utilizes **VisionCamera v5** to interface directly with Android Camera2 / iOS AVFoundation hardware APIs.

### Key Capabilities:
- **Constraint Locking:** Camera frame rate is locked (`constraints: [{ fps: 30 }]`) to eliminate unnecessary thermal stress from 60Hz/120Hz high-refresh sensors.
- **Dynamic Device Switching:** Seamlessly toggles between front-facing and back-facing lenses with instant state persistence.
- **Torch / Flash Control:** Hardware torch support with a 3-minute automatic timeout safety guard to prevent overheating.
- **Snapshot Integration:** High-speed snapshot capture (`takeSnapshot({ quality: ... })`) fed into C++ Nitro raw pixel buffers for machine learning.

---

## 2. Lifecycle & Memory Safety Guards

### 2.1. AppState & Background Freezing
When the user minimizes the app or switches to another application:
1. `AppState` listener triggers an immediate queue flush (`clearQueue()`).
2. Video players pause playback (`player.pause()`).
3. Pending snapshot timers and frame loops are aborted to prevent native JNI security exceptions from revoked hardware permissions.

### 2.2. Cache Bloat Prevention
Both `takeSnapshot` and `ImageManipulator` write intermediate JPEG files to `cacheDirectory`:
- On application startup (`App.tsx`), `initApp` scans `cacheDirectory` and deletes leftover `crop_*` and `media_*` artifacts.
- In `useDetectionLogic.ts`, mount and unmount hooks purge `ImageManipulator/` and `Camera/` cache subdirectories to guarantee zero storage bloat over prolonged sessions.

---

## 3. UI Reticle vs. Autonomous Tracking Modes

The camera screen operates in two primary visual modes:

1. **Auto Mode (Default):**
   - The static central frame is disabled.
   - The **Dynamic Square Box** dynamically appears, expands to 1.5x/2.0x around the user's hand, and smoothly follows the hand across the screen using Reanimated Spring Physics.
2. **Live Reticle Mode:**
   - Displays a classic rectangular scanning target with an animated laser sweep.
   - Best suited for fixed-station or tripod practice.
