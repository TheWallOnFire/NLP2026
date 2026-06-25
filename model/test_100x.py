import numpy as np
import tensorflow as tf
from PIL import Image
import sys
import json
import os

def test_100x(model_path, image_path, labels_path=None):
    if not os.path.exists(model_path):
        print(f"Model not found: {model_path}")
        return
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    # Load Model
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    input_shape = input_details[0]['shape']
    target_size = (input_shape[1], input_shape[2]) if len(input_shape) >= 3 else (224, 224)

    # Load Labels
    words = []
    if labels_path and os.path.exists(labels_path):
        with open(labels_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Tùy theo cấu trúc JSON
            if isinstance(data, list):
                words = [item.get('word', f'Word_{i}') for i, item in enumerate(data)]

    print(f"=== STARTING 100x TEST ===")
    print(f"Model: {model_path}")
    print(f"Image: {image_path}")
    print(f"Input Shape: {input_shape}\n")

    results_set = set()

    for i in range(1, 101):
        # 1. Đọc và tiền xử lý ảnh độc lập mỗi vòng lặp
        # Để mô phỏng sát nhất quá trình của React Native ImageManipulator
        img = Image.open(image_path).convert('RGB')
        img = img.resize(target_size, Image.Resampling.BILINEAR) # Tương đương bóp méo
        
        img_array = np.array(img, dtype=np.float32)
        
        # 2. Chuẩn hóa [-1, 1] (hoặc [0, 1] tùy bạn muốn test)
        img_array = (img_array / 127.5) - 1.0
        
        # Thêm batch dimension
        img_array = np.expand_dims(img_array, axis=0)

        # 3. Inference
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])[0]

        # 4. Trích xuất Top 3
        top_3_idx = np.argsort(output_data)[-3:][::-1]
        
        top_3_str_list = []
        for idx in top_3_idx:
            word_str = words[idx] if idx < len(words) else f"Class_{idx}"
            conf = output_data[idx] * 100
            top_3_str_list.append(f"{word_str}({conf:.2f}%)")
        
        top_3_str = " | ".join(top_3_str_list)
        results_set.add(top_3_str)
        
        print(f"Run {i:03d}: {top_3_str}")

    print("\n=== SUMMARY ===")
    if len(results_set) == 1:
        print("-> 100 runs are EXACTLY THE SAME. Model and image processing are deterministic.")
    else:
        print(f"-> NOISE DETECTED! Found {len(results_set)} different results in 100 runs.")

if __name__ == "__main__":
    model = "mobilenet_best.tflite"
    image = "test.jpg"
    labels = None
    
    if len(sys.argv) > 1: image = sys.argv[1]
    if len(sys.argv) > 2: model = sys.argv[2]
    if len(sys.argv) > 3: labels = sys.argv[3]
    
    test_100x(model, image, labels)
