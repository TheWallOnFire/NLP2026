# Model Pack Schema & Packaging Reference

## 1. `metadata.json` Schema

The `metadata.json` file describes the model's runtime execution parameters:

```json
{
  "id": "asl_mobilenetv2_final_001",
  "name": "ASL MobileNetV2 Final",
  "version": "1.0.0",
  "author": "AI Developer Team",
  "language": "en-US",
  "description": "MobileNetV2 ASL recognition model (29 classes).",
  "input_shape": [1, 224, 224, 3],
  "normalization": "[0, 1]"
}
```

### Fields:
- **`id`** (`string`, required): Unique identifier used for folder sandboxing (`packs/{id}/`). Must be filesystem-safe (lowercase alphanumeric, hyphens, underscores).
- **`name`** (`string`, required): User-facing display name in Model Manager and selection dropdowns.
- **`version`** (`string`, required): Semantic version (`1.0.0`).
- **`author`** (`string`): Contributor or organization name.
- **`language`** (`string`): BCP-47 language tag (e.g. `en-US`, `vi-VN`).
- **`description`** (`string`): Brief summary of training data or domain scope.
- **`input_shape`** (`number[]`, required): 4D tensor shape `[batch, height, width, channels]`.
- **`normalization`** (`string`, required): One of `'[0, 1]'`, `'[-1, 1]'`, or `'[0, 255]'`.

---

## 2. `word_list.json` Schema

The `word_list.json` file maps numeric class indices to vocabulary labels:

```json
{
  "0": "A",
  "1": "B",
  "2": "C",
  ...
  "26": "del",
  "27": "nothing",
  "28": "space"
}
```

Indices must match the argmax output order of the model's final softmax/linear classification layer.
