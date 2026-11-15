---
name: model-pack-management
description: >-
  Use this skill when managing, importing, validating, or modifying the Model Pack
  storage architecture in the NLP2026 app. Covers JSZip pack extraction, file integrity checks,
  dynamic vocabulary registration in Zustand stores, and clean deletion of sandboxed pack folders.
---

# Model Pack Management & Importer Skill

This skill guides AI agents through the lifecycle of Model Packs inside the mobile app: importing `.zip` archives, validating metadata and vocabularies, sandboxing files in local storage, and safe uninstallation.

---

## 1. When to Use This Skill
- Adding new pack import validation checks (e.g. file size limits, corrupt zip handling).
- Modifying how model files (`model.tflite`) or vocabulary illustrations (`word_images/`) are stored and resolved.
- Integrating new stores with model pack state (`useModelStore`, `useLearningStore`).
- Debugging custom pack loading issues or storage leaks.

---

## 2. Storage & Sandboxing Architecture

Model Packs are extracted into app-isolated directories:
```text
${FileSystem.documentDirectory}packs/${packId}/
├── model.tflite
├── metadata.json
└── word_images/
    ├── {word}.png
    └── ...
```

### Clean Wiping on Deletion
Deleting a pack in `useModelStore.deletePack(id)` wipes the entire directory `${FileSystem.documentDirectory}packs/${id}/` using `FileSystem.deleteAsync(packDir, { idempotent: true })`.
In addition:
- `useModelStore` resets `activePackId: state.activePackId === id ? null : state.activePackId` to prevent dangling references.
- `useModelManagerLogic` invokes `removePackWords(pack.id)` to purge orphaned vocabulary from AsyncStorage.
This guarantees **zero storage bloat** and pristine store states.

---

## 3. The Import Workflow (`src/src/utils/packImporter.ts`)

```mermaid
flowchart TD
    Pick["DocumentPicker: Select .zip archive"] --> ValidateZip["Validate extension (.zip) & file size (<150MB)"]
    ValidateZip --> Fetch["Fetch fileUri into ArrayBuffer (prevents base64 OOM)"]
    Fetch --> JSZip["Load with JSZip.loadAsync()"]
    JSZip --> Locate["Locate metadata.json, word_list.json, *.tflite"]
    Locate --> Parse["Parse & validate JSON contents"]
    Parse --> Sandbox["Create directory packs/{packId}/"]
    Sandbox --> SaveTflite["Save model.tflite to storage"]
    SaveTflite --> SaveImgs["Extract word_images/ into pack directory"]
    SaveImgs --> UpdateStores["Update useModelStore & useLearningStore"]
    UpdateStores --> CleanupTemp["Finally: Delete picked temp archive from cache"]
```

See [pack_importer_flow.md](./references/pack_importer_flow.md) for detailed error handling and code references.
