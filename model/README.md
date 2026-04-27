# Model Folder

This folder contains the model-related files for the NLP2026 project.

## Purpose

- Store trained model artifacts, checkpoints, and serialized model files.
- Keep model configuration, architecture definitions, and utility scripts organized.

## Suggested Structure

- `model.py` - main model definition and architecture.
- `train.py` - training loop and training utilities.
- `inference.py` - inference and prediction helpers.
- `config/` - model configuration files.
- `checkpoints/` - saved weights and checkpoints.
- `utils/` - model-related helper functions.

## Usage

1. Place model code and configuration files in this folder.
2. Save checkpoints under `checkpoints/` with clear versioning.
3. Use `train.py` to train the model and `inference.py` to run predictions.

## Notes

- Keep all model-related artifacts in this folder to simplify project maintenance.
- Avoid storing large checkpoint files in source control; use external storage if needed.
