import argparse
import os
import shutil
import sys
import tempfile
import zipfile
import numpy as np
from sklearn.metrics import classification_report
import tensorflow as tf

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate TFLite model on image dataset")
    parser.add_argument(
        "--data",
        type=str,
        default=os.path.join(PROJECT_ROOT, "data", "asl_alphabet_train"),
        help="Path to training/validation image directory"
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to .tflite file"
    )
    parser.add_argument(
        "--pack",
        type=str,
        default=os.path.join(PROJECT_ROOT, "models", "packs", "ASL_MobileNetV2_Final.zip"),
        help="Path to model pack .zip"
    )
    parser.add_argument("--img_size", type=int, default=224, help="Model input size (e.g. 224 or 96)")
    parser.add_argument("--max_samples", type=int, default=500, help="Maximum number of validation samples to evaluate")
    return parser.parse_args()


def resolve_model_path(args):
    """Resolves model path from direct argument or extracts it from a model pack."""
    if args.model and os.path.exists(args.model):
        return os.path.abspath(args.model), None

    if args.pack and os.path.exists(args.pack):
        tmp_dir = tempfile.mkdtemp(prefix="tflite_eval_")
        with zipfile.ZipFile(args.pack, 'r') as z:
            for member in z.namelist():
                if member.endswith(".tflite"):
                    z.extract(member, tmp_dir)
                    return os.path.join(tmp_dir, member), tmp_dir

    return None, None


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    data_dir = os.path.abspath(args.data)
    if not os.path.exists(data_dir):
        print(f"[!] Dataset directory not found at '{data_dir}'.")
        print("    Download the dataset first using: python data/download_dataset.py")
        sys.exit(1)

    model_path, tmp_cleanup = resolve_model_path(args)
    if not model_path:
        print("[!] No valid TFLite model or Model Pack found to evaluate.")
        print("    Generate model packs with: python models/generator.py")
        sys.exit(1)

    try:
        print(f"[*] Loading TFLite model: {model_path}")
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        expected_shape = input_details[0]['shape']
        in_h, in_w = expected_shape[1], expected_shape[2]
        print(f"[*] Model expects input: shape={expected_shape}, dtype={input_details[0]['dtype'].__name__}")

        print(f"[*] Preparing validation subset from '{data_dir}'...")
        dataset = tf.keras.utils.image_dataset_from_directory(
            data_dir,
            labels='inferred',
            label_mode='categorical',
            batch_size=1,
            image_size=(in_h, in_w),
            shuffle=True,
            seed=42,
            validation_split=0.02,
            subset='validation'
        )
        class_names = dataset.class_names

        all_preds = []
        all_labels = []

        print(f"[*] Running TFLite inference (up to {args.max_samples} samples)...")
        count = 0
        for x, y in dataset:
            if count >= args.max_samples:
                break
            img_array = (x.numpy() / 255.0).astype(np.float32)

            interpreter.set_tensor(input_details[0]['index'], img_array)
            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])

            all_preds.append(np.argmax(output_data))
            all_labels.append(np.argmax(y.numpy()[0]))
            count += 1
            if count % 100 == 0:
                print(f"  -> Evaluated {count} samples...")

        acc = np.mean(np.array(all_preds) == np.array(all_labels))
        print(f"\n==================================================")
        print(f"Evaluation Accuracy: {acc * 100:.2f}% ({count} samples)")
        print(f"==================================================")
        print("Classification Report:")
        print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))
    finally:
        if tmp_cleanup and os.path.exists(tmp_cleanup):
            shutil.rmtree(tmp_cleanup, ignore_errors=True)


if __name__ == "__main__":
    main()
