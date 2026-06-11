import argparse
import os
import tensorflow as tf
import numpy as np
from sklearn.metrics import accuracy_score, classification_report

def parse_args():
    parser = argparse.ArgumentParser(description="Kiểm tra mô hình Sign Language trên tập Train")
    parser.add_argument('--model', type=str, default='baseline_best.keras')
    parser.add_argument('--data', type=str, default='data')
    parser.add_argument('--img_size', type=int, default=96)
    parser.add_argument('--batch_size', type=int, default=32)
    return parser.parse_args()

def main():
    args = parse_args()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    print(f"[*] Đang nạp mô hình từ: {args.model}")
    print(f"[*] Đang nạp dữ liệu từ: {args.data}")

    # 1. Khởi tạo Dataset
    print("\n[*] Đang chuẩn bị dataset...")
    test_dataset = tf.keras.utils.image_dataset_from_directory(
        args.data,
        labels='inferred',
        label_mode='categorical', # Ép nhãn về mảng One-hot
        batch_size=args.batch_size,
        image_size=(args.img_size, args.img_size),
        shuffle=False
    )
    class_names = test_dataset.class_names

    # 2. CHUẨN HÓA DỮ LIỆU (Fix lỗi Accuracy 27%)
    # Chia toàn bộ pixel cho 255.0 để đưa về khoảng [0, 1] giống hệt lúc train
    print("[*] Đang chuẩn hóa pixel ảnh (chia cho 255.0)...")
    test_dataset = test_dataset.map(lambda x, y: (x / 255.0, y))

    # 3. Load mô hình
    model = tf.keras.models.load_model(args.model)

    # 4. Đánh giá (Evaluate)
    print("\n[*] Bắt đầu đánh giá (Evaluate)...")
    loss, accuracy = model.evaluate(test_dataset, verbose=1)
    
    # 5. Dự đoán (Predict) để lập báo cáo
    print("[*] Đang trích xuất dự đoán chi tiết...")
    predictions = model.predict(test_dataset, verbose=1)
    
    # Đưa dự đoán từ xác suất về số nguyên
    all_preds = np.argmax(predictions, axis=1)
    
    # Đưa nhãn thật từ One-hot về số nguyên (Fix lỗi Classification Report)
    all_labels = []
    for _, labels in test_dataset:
        all_labels.extend(np.argmax(labels.numpy(), axis=1))

    # 6. In kết quả
    print(f"\n" + "="*50)
    print(f"--- KẾT QUẢ KIỂM TRA TRÊN TẬP DỮ LIỆU ---")
    print(f"Test Loss:     {loss:.4f}")
    print(f"Test Accuracy: {accuracy * 100:.2f}%")
    print("="*50)
    print("\nChi tiết (Classification Report):")
    
    print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))

if __name__ == "__main__":
    main()