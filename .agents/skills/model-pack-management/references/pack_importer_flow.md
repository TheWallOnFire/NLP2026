# Model Pack Importer Implementation Details

## Key Validations in `packImporter.ts`

### 1. File Size Guard
```typescript
const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
  throw new Error("File exceeds 150MB limit.");
}
```
Prevents memory exhaustion on mobile devices when attempting to load massive archives into JavaScript heap.

### 2. ArrayBuffer Reading Strategy
Instead of reading `.zip` files as base64 strings (which doubles memory consumption in Hermes JS engine), `packImporter.ts` uses:
```typescript
const response = await fetch(fileUri);
const arrayBuffer = await response.arrayBuffer();
const zip = new JSZip();
const loadedZip = await zip.loadAsync(arrayBuffer);
```

### 3. Required File Presence
The importer iterates through entries to ensure the 3 core files exist:
- `metadata.json`: Must have `id` and `name`.
- `word_list.json`: Must contain at least one vocabulary entry.
- `*.tflite`: Must contain at least one `.tflite` model weight file.

### 4. Vocabulary Initialization
When import succeeds:
1. `useModelStore.importCustomPack(pack)` adds the pack to the list and sets `isDownloaded: true`.
2. `useLearningStore.initializePackWords(pack.id, words)` registers all words with `learned: false` and `favorite: false`.
