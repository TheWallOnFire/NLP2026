import argparse
import json
import os
import shutil
import sys
import urllib.parse
import urllib.request
import zipfile

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Dynamic paths relative to project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DEFAULT_CONFIG_PATH = os.path.join(PROJECT_ROOT, "configs", "models_config.json")
DEFAULT_MODEL_DIR = os.path.join(BASE_DIR, "model")
DEFAULT_PACKS_DIR = os.path.join(BASE_DIR, "packs")


def parse_args():
    parser = argparse.ArgumentParser(description="Generate and package TFLite Model Packs for NLP2026")
    parser.add_argument("--config", type=str, default=DEFAULT_CONFIG_PATH, help="Path to models_config.json")
    parser.add_argument("--model-dir", type=str, default=DEFAULT_MODEL_DIR, help="Directory containing .keras files")
    parser.add_argument("--packs-dir", type=str, default=DEFAULT_PACKS_DIR, help="Directory to save generated .zip packs")
    parser.add_argument("--pack-name", type=str, default=None, help="Process only a specific pack name")
    return parser.parse_args()


def load_config(config_path):
    if not os.path.exists(config_path):
        print(f"[!] Error: Configuration file not found at '{config_path}'")
        return []
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"[!] Error: Malformed JSON in '{config_path}': {e}")
        return []
    except Exception as e:
        print(f"[!] Error loading config '{config_path}': {e}")
        return []


def ensure_keras_model(model_dir, keras_filename):
    """
    Checks if the requested Keras model exists. If missing, checks whether
    a model.zip archive in model_dir contains it and extracts it automatically.
    """
    target_path = os.path.join(model_dir, keras_filename)
    if os.path.exists(target_path):
        return target_path

    # Check for model.zip in model_dir
    zip_path = os.path.join(model_dir, "model.zip")
    if os.path.exists(zip_path):
        print(f"[*] Extracting '{keras_filename}' from '{zip_path}'...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as z:
                # Search for the member matching the filename
                for member in z.namelist():
                    if member.endswith(keras_filename) or os.path.basename(member) == keras_filename:
                        source = z.open(member)
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        with open(target_path, "wb") as f_out:
                            shutil.copyfileobj(source, f_out)
                        print(f"[*] Extracted successfully to '{target_path}'")
                        return target_path
        except Exception as e:
            print(f"[!] Failed to extract from zip: {e}")

    return None


def copy_or_download_word_image(word_image_url, word, images_dir):
    """Safely handles local files, relative paths, or remote HTTP URLs for word demo images."""
    if not word_image_url:
        return

    dest_path = os.path.join(images_dir, f"{word}.png")
    if os.path.exists(dest_path):
        return

    # Check if remote URL or local file path
    if word_image_url.startswith(("http://", "https://")):
        try:
            url = word_image_url.replace("{word}", urllib.parse.quote(word))
            urllib.request.urlretrieve(url, dest_path)
        except Exception as e:
            print(f"     [!] Failed to download image for '{word}': {e}")
    else:
        # Local or relative path
        formatted_path = word_image_url.replace("{word}", word)
        if not os.path.isabs(formatted_path):
            local_path = os.path.join(PROJECT_ROOT, formatted_path)
        else:
            local_path = formatted_path

        if os.path.exists(local_path):
            try:
                shutil.copy(local_path, dest_path)
            except Exception as e:
                print(f"     [!] Failed to copy image for '{word}': {e}")


def create_model_pack(info, model_dir, packs_dir):
    import tensorflow as tf

    pack_name = info.get("pack_name")
    keras_file = info.get("keras_file")
    words = info.get("words")

    pack_id = info.get("id", pack_name.lower() if pack_name else "unknown")
    version = info.get("version", "1.0.0")
    author = info.get("author", "AI Developer Team")
    language = info.get("language", "en-US")
    description = info.get("description", "ASL Sign Language Model Pack")
    word_image_url = info.get("word_image_url")
    input_shape = info.get("input_shape", [1, 224, 224, 3])
    normalization = info.get("normalization", "[0, 1]")

    if not pack_name or not keras_file or not words:
        print(f"[!] Error: Missing required fields (pack_name, keras_file, words) in config: {info}")
        return False

    saved_model_dir = os.path.join(BASE_DIR, "saved_model")
    pack_dir = os.path.join(saved_model_dir, pack_name)
    assets_dir = os.path.join(pack_dir, "assets")
    vocab_dir = os.path.join(assets_dir, "vocabulary")
    images_dir = os.path.join(vocab_dir, "word_images")

    os.makedirs(images_dir, exist_ok=True)
    print(f"[*] Processing Pack: {pack_name} (ID: {pack_id})...")

    # 1. Resolve and ensure Keras model exists
    keras_file_path = ensure_keras_model(model_dir, keras_file)
    if not keras_file_path or not os.path.exists(keras_file_path):
        print(f"  [!] Skipped: Keras file '{keras_file}' not found in '{model_dir}'")
        return False

    # 2. Collect word images if specified
    if word_image_url:
        for word in words:
            copy_or_download_word_image(word_image_url, word, images_dir)

    # 3. Convert Keras model to optimized TFLite
    try:
        print(f"  -> Converting '{keras_file}' to TFLite (Default optimization)...")
        model = tf.keras.models.load_model(keras_file_path, compile=False)
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = converter.convert()

        tflite_path = os.path.join(assets_dir, "model.tflite")
        with open(tflite_path, "wb") as f:
            f.write(tflite_model)
        print(f"  -> Successfully generated model.tflite ({len(tflite_model) / (1024*1024):.2f} MB)")
    except Exception as e:
        print(f"  [!] Failed to convert '{keras_file}': {e}")
        return False

    # 4. Generate word_list.json
    try:
        word_dict = {str(i): word for i, word in enumerate(words)}
        with open(os.path.join(vocab_dir, "word_list.json"), "w", encoding="utf-8") as f:
            json.dump(word_dict, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  [!] Failed creating word_list.json: {e}")
        return False

    # 5. Generate metadata.json
    try:
        metadata = {
            "id": pack_id,
            "name": pack_name.replace("_", " "),
            "version": version,
            "author": author,
            "language": language,
            "description": description,
            "input_shape": input_shape,
            "normalization": normalization
        }
        with open(os.path.join(assets_dir, "metadata.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  [!] Failed creating metadata.json: {e}")
        return False

    # 6. Generate README.md inside pack
    try:
        readme_content = (
            f"# {metadata['name']}\n\n"
            f"**Version:** {version}\n"
            f"**Author:** {author}\n"
            f"**Language:** {language}\n"
            f"**Input Shape:** {input_shape}\n"
            f"**Normalization:** {normalization}\n\n"
            f"## Description\n{description}\n\n"
            f"## Vocabulary ({len(words)} words)\n"
        )
        for i, w in enumerate(words):
            readme_content += f"- {i}: {w}\n"

        with open(os.path.join(pack_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write(readme_content)
    except Exception as e:
        print(f"  [!] Failed creating README.md: {e}")

    # 7. Compress into .zip archive
    try:
        os.makedirs(packs_dir, exist_ok=True)
        zip_base = os.path.join(packs_dir, pack_name)
        shutil.make_archive(zip_base, 'zip', pack_dir)
        print(f"  -> Generated Model Pack archive: {os.path.join(packs_dir, f'{pack_name}.zip')}")
    except Exception as e:
        print(f"  [!] Failed compressing pack: {e}")
        return False

    print(f"  -> Completed Pack '{pack_name}'!\n")
    return True


def main():
    args = parse_args()
    configs = load_config(args.config)
    if not configs:
        print("[!] No valid configurations loaded.")
        return

    processed = 0
    for info in configs:
        if args.pack_name and info.get("pack_name") != args.pack_name:
            continue
        if create_model_pack(info, args.model_dir, args.packs_dir):
            processed += 1

    print(f"\n[*] Finished processing {processed} Model Pack(s).")


if __name__ == "__main__":
    main()
