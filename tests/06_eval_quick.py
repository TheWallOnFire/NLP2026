import argparse
import os
import sys
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Quick comparative evaluation of trained Keras models")
    parser.add_argument(
        "--data",
        type=str,
        default=os.path.join(PROJECT_ROOT, "data", "asl_alphabet_train"),
        help="Path to training/validation data"
    )
    parser.add_argument(
        "--models",
        nargs="+",
        default=[
            os.path.join(PROJECT_ROOT, "models", "model", "asl_mobilenetv2_final.keras"),
            os.path.join(PROJECT_ROOT, "models", "model", "mobilenet_best.keras")
        ],
        help="List of Keras models to evaluate"
    )
    parser.add_argument("--img_size", type=int, default=224, help="Model input size")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--split", type=float, default=0.02, help="Validation fraction (default 2% ~ 1740 images)")
    return parser.parse_args()


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    data_dir = os.path.abspath(args.data)
    if not os.path.exists(data_dir):
        print(f"[!] Dataset not found at '{data_dir}'.")
        print("    Download it first using: python data/download_dataset.py")
        sys.exit(1)

    available_models = [os.path.abspath(m) for m in args.models if os.path.exists(m)]
    if not available_models:
        print("[!] None of the specified models were found.")
        print(f"    Looked for: {args.models}")
        print("    If model.zip is present, run 'python models/generator.py' to unpack.")
        sys.exit(1)

    print(f"[*] Preparing validation dataset (split={args.split * 100:.1f}%)...")
    dataset = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        labels='inferred',
        label_mode='categorical',
        batch_size=args.batch_size,
        image_size=(args.img_size, args.img_size),
        shuffle=True,
        seed=42,
        validation_split=args.split,
        subset='validation'
    )
    class_names = dataset.class_names
    dataset = dataset.map(lambda x, y: (x / 255.0, y))

    for model_path in available_models:
        print("\n" + "=" * 55)
        print(f"Evaluating Model: {os.path.basename(model_path)}")
        print("=" * 55)
        try:
            model = tf.keras.models.load_model(model_path, compile=False)
            all_preds = []
            all_labels = []
            for x, y in dataset:
                preds = model.predict(x, verbose=0)
                all_preds.extend(np.argmax(preds, axis=1))
                all_labels.extend(np.argmax(y.numpy(), axis=1))

            acc = np.mean(np.array(all_preds) == np.array(all_labels))
            print(f"-> Accuracy: {acc * 100:.2f}%\n")
            print("Classification Report:")
            print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))
        except Exception as e:
            print(f"[!] Evaluation failed for '{model_path}': {e}\n")


if __name__ == "__main__":
    main()
