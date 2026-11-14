import argparse
import os
import shutil
import sys
import tempfile
import zipfile
import tensorflow as tf

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Inspect TFLite Model Input and Output Tensor Shapes")
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Direct path to a .tflite model file"
    )
    parser.add_argument(
        "--pack",
        type=str,
        default=os.path.join(PROJECT_ROOT, "models", "packs", "ASL_MobileNetV2_Final.zip"),
        help="Path to a model pack .zip archive"
    )
    return parser.parse_args()


def inspect_tflite(model_path):
    print(f"[*] Inspecting TFLite file: {model_path}")
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    print("\n--- Input Details ---")
    for i, input_detail in enumerate(interpreter.get_input_details()):
        print(f"  Input #{i}: name='{input_detail['name']}', shape={input_detail['shape']}, dtype={input_detail['dtype'].__name__}")

    print("\n--- Output Details ---")
    for i, output_detail in enumerate(interpreter.get_output_details()):
        print(f"  Output #{i}: name='{output_detail['name']}', shape={output_detail['shape']}, dtype={output_detail['dtype'].__name__}")


def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    # If direct .tflite model is given
    if args.model and os.path.exists(args.model):
        inspect_tflite(os.path.abspath(args.model))
        return

    # Check for palm_detection.tflite in assets
    palm_tflite = os.path.join(PROJECT_ROOT, "src", "assets", "models", "palm_detection.tflite")

    # If pack is specified and exists
    pack_path = os.path.abspath(args.pack)
    if os.path.exists(pack_path):
        tmp_dir = tempfile.mkdtemp(prefix="tflite_inspect_")
        try:
            with zipfile.ZipFile(pack_path, 'r') as z:
                # Look for model.tflite in zip
                for member in z.namelist():
                    if member.endswith(".tflite"):
                        z.extract(member, tmp_dir)
                        extracted_model = os.path.join(tmp_dir, member)
                        inspect_tflite(extracted_model)
                        return
            print(f"[!] No .tflite file found in archive '{pack_path}'")
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)
    elif os.path.exists(palm_tflite):
        print(f"[*] Pack not found at '{pack_path}'. Falling back to bundled palm_detection.tflite...")
        inspect_tflite(palm_tflite)
    else:
        print(f"[!] Pack file '{pack_path}' does not exist.")
        print("    Generate packs first using: python models/generator.py")


if __name__ == "__main__":
    main()
