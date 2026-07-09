# Model Folder

This folder contains the model-related files for the NLP2026 project.

## Purpose

- Store trained model artifacts, checkpoints, and serialized model files.
- Keep model configuration, architecture definitions, and utility scripts organized.

## Structure

- `models_config.json`: File cấu hình chứa thông tin chi tiết về các mô hình hiện có (tên file, input shape, chuẩn hóa, danh sách nhãn).
- `generator.py`: Script dùng để tạo, xử lý và tải mô hình/dữ liệu cho quá trình huấn luyện hoặc phục vụ dự đoán.
- `crop.py`: Script chứa các hàm tiện ích xử lý ảnh (cắt, crop) trước khi đưa vào mô hình.
- `packs/`: Thư mục chứa các gói mô hình (model packs) đã được đóng gói và có thể deploy.
- `notebook/`: Thư mục chứa các Jupyter notebook dùng để nghiên cứu, huấn luyện và đánh giá.
- `model/`: Thư mục chứa các tệp lưu trữ kiến trúc, metadata phụ trợ.

## Available Models

Theo file `models_config.json`, hệ thống đang hỗ trợ các mô hình nhận diện ngôn ngữ ký hiệu ASL (29 lớp gồm A-Z, del, nothing, space):

1. **ASL_Best_Model** (`best_asl_model.keras`): Mô hình CNN cơ bản. Input chuẩn hóa `[0, 1]`.
2. **ASL_EfficientNetB0_Finetuned** (`asl_efficientnetb0_finetuned.keras`): Mô hình dựa trên EfficientNetB0. Input chuẩn hóa `[0, 255]`.
3. **ASL_MobileNetV2_Final** (`asl_mobilenetv2_final.keras`): Mô hình dựa trên MobileNetV2. Input chuẩn hóa `[0, 1]`.

