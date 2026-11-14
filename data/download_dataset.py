import argparse
import os
import subprocess
import sys
import zipfile

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DATA_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="Download and prepare the ASL Alphabet dataset for training")
    parser.add_argument("--dataset", type=str, default="grassknoted/asl-alphabet", help="Kaggle dataset slug")
    parser.add_argument("--dest", type=str, default=DATA_DIR, help="Destination directory for downloaded data")
    parser.add_argument("--keep-zip", action="store_true", help="Keep the downloaded zip archive after extraction")
    return parser.parse_args()


def check_prerequisites():
    """Checks if Kaggle CLI or credentials are available without attempting dynamic pip installs."""
    kaggle_config_default = os.path.expanduser("~/.kaggle/kaggle.json")
    has_token = os.path.exists(kaggle_config_default) or "KAGGLE_USERNAME" in os.environ

    if not has_token:
        print("\n[!] WARNING: Kaggle credentials not found.")
        print("    Please place your 'kaggle.json' token at '~/.kaggle/kaggle.json'")
        print("    or export KAGGLE_USERNAME and KAGGLE_KEY environment variables.\n")

    try:
        import kaggle  # noqa: F401
        return True
    except ImportError:
        # Check if kaggle command-line is available on PATH
        try:
            subprocess.run(["kaggle", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("\n[!] Kaggle package/CLI is not installed.")
            print("    Please install it using: pip install kaggle")
            return False


def download_and_extract():
    args = parse_args()
    dest_dir = os.path.abspath(args.dest)
    os.makedirs(dest_dir, exist_ok=True)
    zip_path = os.path.join(dest_dir, "asl-alphabet.zip")

    if not check_prerequisites():
        sys.exit(1)

    print(f"[*] Downloading '{args.dataset}' to: {dest_dir}...")
    try:
        subprocess.run([
            "kaggle", "datasets", "download",
            "-d", args.dataset,
            "-p", dest_dir
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"[!] Failed to download dataset. Check your Kaggle token and permissions. Error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("[!] Kaggle executable not found in PATH.")
        sys.exit(1)

    print("[*] Download complete. Extracting training set...")

    if os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.namelist():
                # Extract training files directly into asl_alphabet_train
                if member.startswith('asl_alphabet_train/asl_alphabet_train/'):
                    target_path = member.replace('asl_alphabet_train/asl_alphabet_train/', 'asl_alphabet_train/')
                    source = zip_ref.open(member)
                    target_file = os.path.join(dest_dir, target_path)

                    if not target_path.endswith('/'):
                        os.makedirs(os.path.dirname(target_file), exist_ok=True)
                        with open(target_file, "wb") as target:
                            target.write(source.read())

        target_output_dir = os.path.join(dest_dir, 'asl_alphabet_train')
        print(f"[*] Extraction complete! Training data ready in: {target_output_dir}")

        if not args.keep_zip:
            try:
                os.remove(zip_path)
                print("[*] Removed downloaded zip file.")
            except OSError as e:
                print(f"[!] Could not remove zip file: {e}")
    else:
        print(f"[!] Error: Expected zip archive not found at '{zip_path}'")
        sys.exit(1)


if __name__ == "__main__":
    download_and_extract()
