# NLP2026 Sign Language Detector — Technical Design

## Kiến trúc tổng thể
Hệ thống được thiết kế theo kiến trúc **Offline-First Edge AI** dành cho thiết bị di động. Các mô hình Trí tuệ nhân tạo (TensorFlow Lite) được thực thi hoàn toàn trên thiết bị (On-device inference) nhằm đảm bảo độ trễ thấp, không phụ thuộc vào kết nối mạng và bảo mật tuyệt đối dữ liệu cá nhân của người dùng.
Ứng dụng sử dụng React Native (Expo) cho giao diện đa nền tảng kết hợp với Zustand để quản lý trạng thái cục bộ.

## C4 Diagram

### Level 1 — System Context
Người dùng (Người học ngôn ngữ ký hiệu, Người khiếm thính) tương tác trực tiếp với Mobile App. Mobile App sử dụng Camera của thiết bị để thu thập luồng hình ảnh thời gian thực, thực hiện dự đoán ký hiệu và phản hồi lại bằng UI/Âm thanh (TTS).

### Level 2 — Container
- **Mobile Application (Frontend):** Xây dựng bằng React Native (Expo). Bao gồm UI/UX Components, Camera module (`expo-camera`), State Management (Zustand).
- **AI Inference Engine:** Tích hợp TensorFlow Lite/TensorFlow.js để thực thi các file mô hình `.tflite`.
- **Local Storage:** `AsyncStorage` và File System dùng để lưu lịch sử, cấu hình và nội dung của các gói mô hình tùy chỉnh.

## High-Level Architecture Diagram
[Camera Input] -> [Frame Preprocessing] -> [TFLite Model Inference] -> [Result Post-processing] -> [UI Display & Text-to-Speech]

## Thiết kế cơ sở dữ liệu
Hệ thống không sử dụng CSDL quan hệ phức tạp. Dữ liệu được lưu dưới dạng JSON cục bộ (`AsyncStorage` / Zustand Persist).
Các Entity chính:
- **ModelPack:** Quản lý gói mô hình (ID, Tên, Version, Đường dẫn file `.tflite`, Danh sách từ vựng).
- **History:** Nhật ký phiên (ID, Loại phiên (Học/Kiểm tra), Điểm số, Thời lượng, Timestamp).
- **Vocabulary:** Quản lý từ vựng (ID, Từ, Trạng thái (Đã học, Yêu thích)).

## Thiết kế kiểm soát truy cập
Không yêu cầu hệ thống đăng nhập phức tạp do ứng dụng ưu tiên hoạt động offline và quyền riêng tư. 
Tuy nhiên, ứng dụng phải xin quyền truy cập rõ ràng vào Camera và Microphone từ người dùng trước khi bắt đầu tính năng nhận diện.

## Thiết kế các cơ chế bảo vệ hệ thống

### Quản lý hiệu năng và tiết kiệm pin (Battery Saver Mode)
Cung cấp tùy chọn điều chỉnh tốc độ nhận diện (Fast/Normal/Slow). Chế độ Slow (3 giây/lần) hoặc Manual Trigger giúp giảm số lượng khung hình cần xử lý, từ đó giảm tải CPU/GPU và tiết kiệm pin.

### Quản lý bộ nhớ cho Model Packs
Mỗi gói mô hình (.zip) khi import được giải nén vào một thư mục cách ly (`packs/{id}/`). Khi người dùng yêu cầu xóa mô hình, toàn bộ thư mục này bị xóa hoàn toàn khỏi File System để ngăn ngừa tình trạng rác hệ thống (storage bloat).

### Caching kết quả nhận diện
Sử dụng bộ đệm nhỏ để lưu kết quả nhận diện của các frame liên tiếp. Ký hiệu chỉ được xác nhận khi model dự đoán trùng khớp liên tiếp qua N frames, giúp làm mịn (smooth) kết quả hiển thị, tránh hiện tượng kết quả nhảy lung tung do nhiễu.

## Các quyết định kỹ thuật quan trọng (ADR)
- **Sử dụng React Native (Expo) thay vì Native (Android/iOS):** Rút ngắn thời gian phát triển đa nền tảng, cho phép dễ dàng xây dựng giao diện đẹp mắt mà không cần code 2 lần, phù hợp với team có chuyên môn Web/JS.
- **Sử dụng TensorFlow Lite chạy Local:** Đảm bảo độ trễ gần như bằng không, cho phép ứng dụng hoạt động 100% offline và loại bỏ hoàn toàn các rủi ro bảo mật liên quan đến việc truyền hình ảnh người dùng lên cloud.
- **Sử dụng Zustand:** Gọn nhẹ, ít boilerplate hơn Redux, hỗ trợ tích hợp middleware lưu trữ local (`persist`) cực kỳ thuận tiện cho các thiết lập của người dùng.