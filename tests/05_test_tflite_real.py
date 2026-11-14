import argparse
import os
import shutil
import sys
import tempfile
import zipfile
import numpy as np
import cv2
import tensorflow as tf

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Test TFLite model on a single real or sample image")
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to direct .tflite model file"
    )
    parser.add_argument(
        "--pack",
        type=str,
        default=os.path.join(PROJECT_ROOT, "models", "packs", "ASL_MobileNetV2_Final.zip"),
        help="Path to model pack .zip"
    )
    parser.add_argument(
        "--image",
        type=str,
        default=None,
        help="Path to real image file to test"
    )
    return parser.parse_args()


def resolve_model(args):
    if args.model and os.path.exists(args.model):
        return os.path.abspath(args.model), None

    if args.pack and os.path.exists(args.pack):
        tmp_dir = tempfile.mkdtemp(prefix="tflite_single_")
        with zipfile.ZipFile(args.pack, 'r') as z:
            for member in z.namelist():
                if member.endswith(".tflite"):
                    z.extract(member, tmp_dir)
                    return os.path.join(tmp_dir, member), tmp_dir

    palm_model = os.path.join(PROJECT_ROOT, "src", "assets", "models", "palm_detection.tflite")
    if os.path.exists(palm_model):
        print(f"[*] Using bundled palm_detection.tflite as default...")
        return palm_model, None

    return None, None


def find_sample_image(specified_path):
    if specified_path and os.path.exists(specified_path):
        return os.path.abspath(specified_path)

    # Search screenshot folder for test image
    screenshot_dir = os.path.join(PROJECT_ROOT, "screenshot")
    if os.path.exists(screenshot_dir):
        images = [os.path.join(screenshot_dir, f) for f in os.listdir(screenshot_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if images:
            return images[0]

    return None


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    model_path, tmp_cleanup = resolve_model(args)
    if not model_path:
        print("[!] No TFLite model available. Run 'python models/generator.py' to generate one.")
        sys.exit(1)

    try:
        print(f"[*] Initializing interpreter from: {model_path}")
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        shape = input_details[0]['shape']
        in_h, in_w = shape[1], shape[2]
        dtype = input_details[0]['dtype']
        print(f"[*] Input shape: {shape}, dtype: {dtype.__name__}")

        sample_img_path = find_sample_image(args.image)
        if sample_img_path:
            print(f"[*] Loading image: {sample_img_path}")
            img = cv2.imread(sample_img_path)
            if img is not None:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = cv2.resize(img, (in_w, in_h))
                if dtype == np.float32:
                    img_array = np.expand_dims(img, axis=0).astype(np.float32) / 255.0
                else:
                    img_array = np.expand_dims(img, axis=0).astype(dtype)
            else:
                print("[!] OpenCV failed to decode image. Falling back to synthetic tensor.")
                img_array = np.zeros(shape, dtype=dtype)
        else:
            print("[*] No test image found on disk. Generating synthetic zero-tensor for shape test...")
            img_array = np.zeros(shape, dtype=dtype)

        print(f"[*] Running inference on tensor shape {img_array.shape} (sum: {np.sum(img_array):.4f})...")
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])

        print(f"\n--- INFERENCE RESULTS ---")
        print(f"Output Tensor Shape: {output_data.shape}")
        flat_output = output_data.flatten()
        max_idx = int(np.argmax(flat_output))
        max_val = float(flat_output[max_idx])
        print(f"Top Class Index:     {max_idx}")
        print(f"Confidence Score:    {max_val:.4f}")
        print(f"Raw Output Preview:  {flat_output[:5]} ...")
    finally:
        if tmp_cleanup and os.path.exists(tmp_cleanup):
            shutil.rmtree(tmp_cleanup, ignore_errors=True)


if __name__ == "__main__":
    main()
