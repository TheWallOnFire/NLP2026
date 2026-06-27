import urllib.request
import os

MODEL_URL = "https://storage.googleapis.com/mediapipe-assets/palm_detection_full.tflite"

OUTPUT_DIR = "assets/models"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "palm_detection.tflite")

def download_model():
    print(f"Downloading model from: {MODEL_URL}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    try:
        urllib.request.urlretrieve(MODEL_URL, OUTPUT_PATH)
        print(f"Success! Model saved at: {os.path.abspath(OUTPUT_PATH)}")
    except Exception as e:
        print(f"Error downloading model: {e}")

if __name__ == "__main__":
    download_model()
