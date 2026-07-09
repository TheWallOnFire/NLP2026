import os
import subprocess
import sys
import zipfile

def download_and_extract():
    """
    Downloads the ASL Alphabet dataset from Kaggle and extracts it.
    Requires the Kaggle CLI and an active kaggle.json token.
    """
    dataset_name = "grassknoted/asl-alphabet"
    download_dir = os.path.dirname(os.path.abspath(__file__))
    zip_path = os.path.join(download_dir, "asl-alphabet.zip")

    print(f"Preparing to download '{dataset_name}' to {download_dir}...")
    
    # Check if kaggle is installed
    try:
        import kaggle
    except ImportError:
        print("Kaggle package not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kaggle"])

    print("\n[NOTE] Make sure you have your kaggle.json API token in ~/.kaggle/kaggle.json")
    print("If you don't have one, get it from your Kaggle Account settings.\n")

    # Run the kaggle download command
    try:
        subprocess.run([
            "kaggle", "datasets", "download", 
            "-d", dataset_name, 
            "-p", download_dir
        ], check=True)
    except subprocess.CalledProcessError as e:
        print("Failed to download the dataset. Please check your Kaggle API credentials.")
        sys.exit(1)
    except FileNotFoundError:
        print("Kaggle CLI not found. Please ensure it's installed and in your PATH.")
        sys.exit(1)

    print("Download complete. Extracting files...")

    # Extract the zip file
    if os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Extract only the train directory to match the expected structure
            for member in zip_ref.namelist():
                if member.startswith('asl_alphabet_train/asl_alphabet_train/'):
                    # Simplify the path so it extracts directly into data/asl_alphabet_train
                    target_path = member.replace('asl_alphabet_train/asl_alphabet_train/', 'asl_alphabet_train/')
                    source = zip_ref.open(member)
                    target_file = os.path.join(download_dir, target_path)
                    
                    if not target_path.endswith('/'):
                        os.makedirs(os.path.dirname(target_file), exist_ok=True)
                        with open(target_file, "wb") as target:
                            target.write(source.read())
                            
        print(f"Extraction complete! Data is available in: {os.path.join(download_dir, 'asl_alphabet_train')}")
        
        # Cleanup the zip file
        os.remove(zip_path)
        print("Cleaned up zip file.")
    else:
        print(f"Error: Could not find the downloaded zip file at {zip_path}")

if __name__ == "__main__":
    download_and_extract()
