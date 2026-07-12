# NLP2026 Sign Language Detector — Project Proposal

## Vấn đề
Giao tiếp giữa người khiếm thính và người bình thường gặp nhiều rào cản do thiếu công cụ phiên dịch tức thời và dễ tiếp cận. Các ứng dụng hiện tại thường yêu cầu kết nối mạng, xử lý chậm, hoặc không hỗ trợ tùy chỉnh mô hình học máy cho các ngôn ngữ ký hiệu khác nhau, dẫn đến trải nghiệm người dùng kém và khó ứng dụng trong thực tế.

## Mục tiêu
Xây dựng một ứng dụng di động nhận diện ngôn ngữ ký hiệu theo thời gian thực (Real-time Sign Language Detection) với các mục tiêu:
- Tốc độ nhận diện nhanh, độ trễ thấp (15-30 FPS) trực tiếp trên thiết bị (Offline-first).
- Hỗ trợ tải các gói mô hình (Model Packs) linh hoạt để mở rộng từ vựng và ngôn ngữ.
- Cung cấp môi trường học tập, thực hành và kiểm tra (Test Mode) ngôn ngữ ký hiệu hiệu quả.

## Người dùng và nhu cầu
- **Người khiếm thính:** Cần một công cụ để phiên dịch ngôn ngữ ký hiệu sang văn bản/giọng nói để giao tiếp với người xung quanh.
- **Người học ngôn ngữ ký hiệu:** Cần ứng dụng để luyện tập, nhận phản hồi tức thời về độ chính xác của các ký hiệu họ thực hiện.
- **Nhà phát triển/Nghiên cứu AI:** Cần khả năng tích hợp và thử nghiệm các mô hình TensorFlow Lite mới dễ dàng trên thiết bị di động.

## Phạm vi
- **Trong phạm vi:** Xây dựng ứng dụng di động đa nền tảng bằng React Native (Expo) nhận diện qua camera, quản lý trạng thái học tập, hỗ trợ file `.tflite` động, và các kịch bản kiểm tra (gamification).
- **Ngoài phạm vi:** Xây dựng hệ thống cloud backend phức tạp để huấn luyện AI trên app, huấn luyện các mô hình AI ngôn ngữ tự nhiên cấp độ câu phức tạp (hiện tại tập trung vào từ vựng/chữ cái/số).

## Rủi ro và ràng buộc
- **Hiệu năng thiết bị:** Nhận diện AI thời gian thực tiêu tốn nhiều tài nguyên (CPU/GPU), có thể gây nóng máy hoặc hao pin trên các thiết bị cấu hình thấp.
- **Độ chính xác của AI:** Phụ thuộc nhiều vào chất lượng camera, điều kiện ánh sáng và góc độ thực hiện ký hiệu của người dùng.
- **Giới hạn của thư viện:** Việc sử dụng Expo Go có thể bị giới hạn khi truy cập sâu vào một số module Native của Camera và TFLite, yêu cầu thiết lập mock hoặc custom dev clients.