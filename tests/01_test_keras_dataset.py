import argparse
import os
import sys
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate Keras Sign Language Model on Dataset")
    parser.add_argument(
        '--model',
        type=str,
        default=os.path.join(PROJECT_ROOT, 'models', 'model', 'asl_mobilenetv2_final.keras'),
        help="Path to .keras model file"
    )
    parser.add_argument(
        '--data',
        type=str,
        default=os.path.join(PROJECT_ROOT, 'data', 'asl_alphabet_train'),
        help="Path to training/testing image directory"
    )
    parser.add_argument('--img_size', type=int, default=224, help="Input image dimension (default: 224)")
    parser.add_argument('--batch_size', type=int, default=32, help="Evaluation batch size")
    return parser.parse_args()


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    model_path = os.path.abspath(args.model)
    data_path = os.path.abspath(args.data)

    print(f"[*] Loading model from: {model_path}")
    print(f"[*] Loading dataset from: {data_path}")

    if not os.path.exists(model_path):
        print(f"[!] Error: Model file not found at '{model_path}'.")
        print("    If model.zip exists in 'models/model/', run generator.py first to extract it.")
        sys.exit(1)

    if not os.path.exists(data_path):
        print(f"[!] Error: Data directory not found at '{data_path}'.")
        print("    Run 'python data/download_dataset.py' to download the dataset.")
        sys.exit(1)

    # 1. Initialize Dataset
    print("\n[*] Initializing image dataset...")
    test_dataset = tf.keras.utils.image_dataset_from_directory(
        data_path,
        labels='inferred',
        label_mode='categorical',
        batch_size=args.batch_size,
        image_size=(args.img_size, args.img_size),
        shuffle=False
    )
    class_names = test_dataset.class_names

    # 2. Normalize Pixel Values to [0, 1]
    print("[*] Normalizing pixel range to [0, 1]...")
    test_dataset = test_dataset.map(lambda x, y: (x / 255.0, y))

    # 3. Load Model
    model = tf.keras.models.load_model(model_path, compile=False)

    # 4. Evaluate
    print("\n[*] Evaluating model on dataset...")
    predictions = model.predict(test_dataset, verbose=1)
    all_preds = np.argmax(predictions, axis=1)

    all_labels = []
    for _, labels in test_dataset:
        all_labels.extend(np.argmax(labels.numpy(), axis=1))

    accuracy = np.mean(np.array(all_preds) == np.array(all_labels))

    print(f"\n" + "=" * 50)
    print("--- EVALUATION SUMMARY ---")
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("=" * 50)
    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))


if __name__ == "__main__":
    main()
