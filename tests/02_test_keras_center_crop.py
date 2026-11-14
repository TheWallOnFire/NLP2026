import argparse
import os
import sys
import numpy as np
import tensorflow as tf
import cv2

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)

CLASSES = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'nothing', 'space'
]


def parse_args():
    parser = argparse.ArgumentParser(description="Test Center-Crop inference on images using Keras")
    parser.add_argument(
        '--model',
        type=str,
        default=os.path.join(PROJECT_ROOT, 'models', 'model', 'asl_mobilenetv2_final.keras'),
        help="Path to .keras model file"
    )
    parser.add_argument(
        '--data',
        type=str,
        default=os.path.join(PROJECT_ROOT, 'screenshot'),
        help="Directory containing images to test"
    )
    parser.add_argument('--img_size', type=int, default=224, help="Input dimension for model")
    parser.add_argument('--save-crops', action='store_true', help="Save cropped images locally for verification")
    return parser.parse_args()


def center_crop(img):
    """Crops the largest center square from the image."""
    h, w, _ = img.shape
    min_dim = min(h, w)
    start_x = (w // 2) - (min_dim // 2)
    start_y = (h // 2) - (min_dim // 2)
    return img[start_y:start_y + min_dim, start_x:start_x + min_dim]


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    model_path = os.path.abspath(args.model)
    data_path = os.path.abspath(args.data)

    print(f"[*] Loading model: {model_path}")
    print(f"[*] Scanning images from: {data_path}")

    if not os.path.exists(model_path):
        print(f"[!] Model not found at '{model_path}'. Check if model.zip has been extracted.")
        sys.exit(1)

    if not os.path.exists(data_path):
        print(f"[!] Image directory '{data_path}' not found.")
        sys.exit(1)

    try:
        model = tf.keras.models.load_model(model_path, compile=False)
    except Exception as e:
        print(f"[!] Failed to load model: {e}")
        sys.exit(1)

    image_files = [f for f in os.listdir(data_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
    if not image_files:
        print(f"[!] No supported image files found in '{data_path}'.")
        return

    print(f"[*] Found {len(image_files)} image(s). Running predictions...\n" + "=" * 65)

    for img_name in image_files:
        img_path = os.path.join(data_path, img_name)
        img = cv2.imread(img_path)
        if img is None:
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        cropped_img = center_crop(img_rgb)

        if args.save_crops:
            crop_out = os.path.join(data_path, f"crop_{img_name}")
            cv2.imwrite(crop_out, cv2.cvtColor(cropped_img, cv2.COLOR_RGB2BGR))

        resized_img = cv2.resize(cropped_img, (args.img_size, args.img_size))
        img_array = np.expand_dims(resized_img, axis=0) / 255.0

        predictions = model.predict(img_array, verbose=0)[0]
        max_idx = np.argmax(predictions)
        pred_class = CLASSES[max_idx] if max_idx < len(CLASSES) else f"Idx_{max_idx}"
        confidence = predictions[max_idx] * 100

        print(f"File: {img_name:<20} | Pred: [{pred_class:<7}] | Conf: {confidence:.2f}%")


if __name__ == "__main__":
    main()
