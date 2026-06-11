import argparse
import os
import numpy as np
import tensorflow as tf
import cv2

# Khai báo sẵn danh sách 29 class
CLASSES = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 
    'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'nothing', 'space'
]

def parse_args():
    parser = argparse.ArgumentParser(description="Inference bằng phương pháp Center Crop (Không dùng MediaPipe)")
    parser.add_argument('--model', type=str, default='baseline_best.keras')
    parser.add_argument('--data', type=str, required=True, help='Thư mục chứa ảnh')
    parser.add_argument('--img_size', type=int, default=96)
    return parser.parse_args()

def center_crop(img):
    """Cắt một hình vuông lớn nhất ở chính giữa bức ảnh"""
    h, w, _ = img.shape
    min_dim = min(h, w)
    start_x = (w // 2) - (min_dim // 2)
    start_y = (h // 2) - (min_dim // 2)
    return img[start_y:start_y+min_dim, start_x:start_x+min_dim]

def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    print(f"[*] Đang nạp mô hình từ: {args.model}")
    try:
        model = tf.keras.models.load_model(args.model)
    except Exception as e:
        print(f"[!] Lỗi khi tải mô hình: {e}")
        return
    
    # Lấy file ảnh
    image_files = [f for f in os.listdir(args.data) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
    print(f"[*] Tìm thấy {len(image_files)} ảnh. Bắt đầu dự đoán...\n" + "="*60)

    for img_name in image_files:
        img_path = os.path.join(args.data, img_name)
        
        # 1. Đọc ảnh bằng OpenCV
        img = cv2.imread(img_path)
        if img is None:
            continue
            
        # OpenCV mặc định là BGR, chuyển sang RGB cho Keras
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 2. Cắt vuông từ chính tâm ảnh (Giả định tay luôn ở giữa khung hình)
        cropped_img = center_crop(img_rgb)
        
        # (Tùy chọn) Lưu ảnh đã cắt ra để bạn xem thử nó cắt đúng chưa
        cv2.imwrite(f"cropped_{img_name}", cv2.cvtColor(cropped_img, cv2.COLOR_RGB2BGR))

        # 3. Resize về 96x96 và chuẩn hóa cho Keras (chia 255.0)
        resized_img = cv2.resize(cropped_img, (args.img_size, args.img_size))
        img_array = np.expand_dims(resized_img, axis=0) / 255.0
        
        # 4. Dự đoán
        predictions = model.predict(img_array, verbose=0)
        pred_class = CLASSES[np.argmax(predictions)]
        confidence = np.max(predictions) * 100
        
        print(f"Ảnh: {img_name:<15} | Trạng thái: [Cắt Tâm] | Dự đoán: [{pred_class:<7}] ({confidence:.1f}%)")

if __name__ == "__main__":
    main()