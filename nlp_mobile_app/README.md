# NLP Mobile App Project

Professional project structure for a mobile application integrated with an NLP model.

## Directory Structure

- **`/mobile`**: Mobile application source code (Flutter, React Native, etc.).
- **`/backend`**: NLP model serving API (FastAPI, Flask) and backend logic.
- **`/model_development`**: Model experimentation, training scripts, and weights.
  - `/notebooks`: Jupyter notebooks for EDA and prototyping.
  - `/scripts`: Python scripts for training and evaluation.
  - `/weights`: Saved model checkpoints and exported formats (e.g., ONNX, TFLite).
- **`/data`**: Dataset management.
  - `/raw`: Original, immutable data.
  - `/processed`: Cleaned and formatted data for training.
- **`/docs`**: Project documentation, architecture diagrams, and API specs.
- **`/scripts`**: Automation, deployment, and utility scripts.
- **`/tests`**: Unit and integration tests for all components.

## Setup Instructions

1. **Backend**: Navigate to `/backend`, create a virtual environment, and install dependencies.
2. **Mobile**: Navigate to `/mobile` and follow the framework-specific setup (e.g., `flutter pub get`).
3. **Model**: Use `/model_development` to train or optimize your NLP model for mobile deployment.
