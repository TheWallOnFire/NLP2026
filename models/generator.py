import tensorflow as tf
import os
import json
import shutil
import urllib.request
import sys

# Đảm bảo console in được tiếng Việt
sys.stdout.reconfigure(encoding='utf-8')

# 1. Định nghĩa danh sách các file Keras của bạn và thông tin metadata tương ứng
def load_config(config_filename="models_config.json"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(base_dir, "..", "configs", config_filename)
    if not os.path.exists(config_path):
        print(f"Lỗi: Không tìm thấy file cấu hình '{config_path}'")
        return []
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Lỗi: File '{config_path}' không đúng định dạng JSON. Chi tiết: {e}")
        return []
    except Exception as e:
        print(f"Lỗi không xác định khi đọc file '{config_path}': {e}")
        return []

def create_model_pack(info):
    pack_name = info.get("pack_name")
    keras_file = info.get("keras_file")
    words = info.get("words")
    
    # Đọc các thông số chi tiết hơn từ JSON
    pack_id = info.get("id", pack_name.lower() if pack_name else "unknown")
    version = info.get("version", "1.0.0")
    author = info.get("author", "Your Name")
    language = info.get("language", "en-US")
    description = info.get("description", "Không có mô tả")
    word_image_url = info.get("word_image_url")

    if not pack_name or not keras_file or not words:
        print(f"Lỗi: Thiếu thông tin bắt buộc (pack_name, keras_file, words) trong cấu hình: {info}")
        return

    # Đảm bảo output nằm trong thư mục 'saved_model'
    base_dir = os.path.dirname(os.path.abspath(__file__))
    saved_model_dir = os.path.join(base_dir, "saved_model")
    os.makedirs(saved_model_dir, exist_ok=True)
    
    pack_dir = os.path.join(saved_model_dir, pack_name)
    keras_file_path = os.path.join(base_dir, "model", keras_file)
    
    assets_dir = os.path.join(pack_dir, "assets")
    vocab_dir = os.path.join(assets_dir, "vocabulary")
    images_dir = os.path.join(vocab_dir, "word_images")

    # 2. Tạo cấu trúc thư mục
    os.makedirs(images_dir, exist_ok=True)
    print(f"Đang xử lý Pack: {pack_name}...")

    # Tải placeholder images nếu có URL
    if word_image_url:
        print("  -> Đang tải placeholder images cho các từ vựng...")
        for word in words:
            try:
                # Thay thế placeholder {word} bằng từ thực tế
                url = word_image_url.replace("{word}", urllib.parse.quote(word))
                img_path = os.path.join(images_dir, f"{word}.png")
                # Chỉ tải nếu chưa có
                if not os.path.exists(img_path):
                    urllib.request.urlretrieve(url, img_path)
            except Exception as e:
                print(f"     [!] Lỗi tải ảnh cho từ '{word}': {e}")

    # 3. Chuyển đổi mô hình Keras sang TFLite
    try:
        if not os.path.exists(keras_file_path):
            print(f"  -> Lỗi: Không tìm thấy file Keras '{keras_file_path}'")
            return
            
        model = tf.keras.models.load_model(keras_file_path)
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        
        # Tối ưu hóa mô hình (Tùy chọn giúp model nhẹ hơn cho điện thoại)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        tflite_model = converter.convert()

        # Lưu file model.tflite
        tflite_path = os.path.join(assets_dir, "model.tflite")
        with open(tflite_path, "wb") as f:
            f.write(tflite_model)
        print("  -> Đã convert thành công model.tflite")
    except Exception as e:
        print(f"  -> Lỗi convert file '{keras_file}': {e}")
        return

    # 4. Tạo file word_list.json
    try:
        word_dict = {str(i): word for i, word in enumerate(words)}
        with open(os.path.join(vocab_dir, "word_list.json"), "w", encoding="utf-8") as f:
            json.dump(word_dict, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  -> Lỗi khi tạo word_list.json: {e}")
        return
    
    # 5. Tạo file metadata.json
    try:
        metadata = {
            "id": pack_id,
            "name": pack_name.replace("_", " "),
            "version": version,
            "author": author,
            "language": language,
            "description": description,
            "input_shape": info.get("input_shape", [1, 224, 224, 3]),
            "normalization": info.get("normalization", "[0, 1]")
        }
        with open(os.path.join(assets_dir, "metadata.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  -> Lỗi khi tạo metadata.json: {e}")
        return
        
    # 6. Tạo file README.md cho pack
    try:
        readme_content = f"# {metadata['name']}\n\n**Version:** {version}\n**Author:** {author}\n**Language:** {language}\n\n## Description\n{description}\n\n## Vocabulary\n"
        for i, w in enumerate(words):
            readme_content += f"- {i}: {w}\n"
            
        with open(os.path.join(pack_dir, "README.md"), "w", encoding="utf-8") as f:
            f.write(readme_content)
    except Exception as e:
        print(f"  -> Lỗi khi tạo README.md: {e}")

    # 7. Nén (Zip) thư mục output
    try:
        packs_dir = os.path.join(base_dir, "packs")
        os.makedirs(packs_dir, exist_ok=True)
        
        zip_path = os.path.join(packs_dir, pack_name)
        shutil.make_archive(zip_path, 'zip', pack_dir)
        print(f"  -> Đã nén thành công: {pack_name}.zip (lưu trong packs/)")
    except Exception as e:
        print(f"  -> Lỗi khi nén thư mục: {e}")
        
    print(f"  -> Hoàn thành tạo Pack '{pack_name}'!\n")

if __name__ == "__main__":
    # Đọc cấu hình từ file JSON
    models_info = load_config("models_config.json")
    if not models_info:
        print("Không có model nào để xử lý. Vui lòng kiểm tra lại file models_config.json.")
    else:
        # Chạy vòng lặp tạo pack cho các mô hình
        for info in models_info:
            create_model_pack(info)
    
        print("Quá trình xử lý Model Packs đã kết thúc!")
