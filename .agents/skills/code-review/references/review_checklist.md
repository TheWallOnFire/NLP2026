# Code Review Inspection Checklist

Use this checklist during Phase 2, 3, and 4 of the code review procedure:

## 1. Correctness & Logic
- [ ] Are all boundary conditions handled (empty arrays, zero length, null, undefined)?
- [ ] Are array indices checked before accessing (`index >= 0 && index < array.length`)?
- [ ] Are floating-point comparisons safe from division by zero or NaN pollution?
- [ ] Are state transitions in finite state machines (e.g. `SEARCHING` <-> `TRACKING`) unambiguous?

## 2. Memory & Lifecycles
- [ ] Do all `useEffect` hooks with timers (`setTimeout`, `setInterval`) return a cleanup function?
- [ ] Are native camera references and video players paused or disposed when the app enters the background?
- [ ] Are temporary files in `cacheDirectory` purged to prevent disk bloat?
- [ ] Are typed arrays allocated over shared buffers using `view.byteOffset`?
- [ ] Does model pack deletion completely delete the sandboxed directory `${FileSystem.documentDirectory}packs/${id}/`?

## 3. Concurrency & Asynchrony
- [ ] Are asynchronous functions guarded by `isMounted` checks before updating React state?
- [ ] Is heavy matrix inference offloaded to background C++ threads (`await tfliteModel.run()`) instead of blocking `runSync()` on JS thread?
- [ ] Are Reanimated animations driven by UI Thread SharedValues rather than React state re-renders?
- [ ] Are event-listener callbacks debounced or throttled appropriately?

## 4. Security & Privacy
- [ ] Are there any hardcoded file system paths (e.g. `d:/...`, `C:\...`)?
- [ ] Are user camera streams or photos strictly contained on-device with zero cloud leakage?
- [ ] Is input validation performed on imported `.zip` archives (file size limit, schema validation)?

## 5. Performance & Mobile Constraints
- [ ] Is the camera frame rate constrained to 30 FPS to avoid thermal throttling?
- [ ] Are heavy objects memoized (`useMemo`, `useCallback`) to avoid redundant re-renders?
- [ ] Are images downscaled before feeding into neural networks?

