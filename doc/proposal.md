# NLP2026 Sign Language Detector — Project Proposal

---

## 1. 📌 Đặt vấn đề (Problem Statement)
Giao tiếp giữa cộng đồng người khiếm thính và người bình thường gặp nhiều rào cản do thiếu các công cụ phiên dịch tức thời, trực quan và dễ tiếp cận. Đa số các giải pháp hiện nay:
- Đòi hỏi kết nối Internet băng thông cao để truyền video lên Cloud, gây ra độ trễ lớn và rủi ro rò rỉ hình ảnh riêng tư.
- Khóa cứng từ vựng, không cho phép cập nhật hoặc thay thế các gói mô hình ngôn ngữ ký hiệu chuyên biệt (ví dụ: bảng chữ cái, y tế, số đếm).
- Thiếu các phương pháp tương tác phản hồi học tập tức thời (feedback loop) và chế độ kiểm tra gamification giúp người học ghi nhớ lâu.

---

## 2. 🎯 Mục tiêu Dự án (Project Objectives)
Xây dựng một ứng dụng di động nhận diện ngôn ngữ ký hiệu theo thời gian thực (**Real-time On-Device Sign Language Detector**) với các chỉ tiêu:
1. **Hiệu năng cao & Độ trễ thấp:** Đạt tốc độ nhận diện 15–30 FPS trực tiếp trên phần cứng di động (Offline-first Edge AI).
2. **Theo dõi Bàn tay Thông minh (Smart Hand Tracking):** Tự động phát hiện và bám sát cử chỉ bàn tay trên toàn bộ không gian camera mà không bắt ép người dùng giữ tay cố định ở tâm màn hình.
3. **Mở rộng Động (Dynamic Model Packs):** Hỗ trợ import/export các gói mô hình (`.zip` chứa `.tflite` và từ vựng) mà không cần phải biên dịch lại ứng dụng.
4. **Môi trường Học tập & Thử thách:** Cung cấp chế độ học Flashcard tương tác, luyện tập có camera chấm điểm tự động và các chế độ kiểm tra (Time Attack, Fixed Sprint).

---

## 3. 👥 Đối tượng Người dùng & Nhu cầu (Target Audience)
- **Người khiếm thính & người thân:** Cần công cụ phiên dịch ngôn ngữ ký hiệu sang văn bản và giọng nói (Text-To-Speech) ngay trên điện thoại để giao tiếp hằng ngày.
- **Người học ngôn ngữ ký hiệu (Students / Beginners):** Cần một nền tảng thực hành có chấm điểm độ chuẩn xác, ghi nhớ từ vựng đã học, từ vựng yêu thích và đo lường tiến độ.
- **Nhà phát triển & Nhà nghiên cứu AI:** Cần khả năng kiểm thử (ML Diagnostics) và triển khai các mô hình TensorFlow Lite mới dễ dàng trên thiết bị di động.

---

## 4. 📐 Phạm vi Dự án (Project Scope)

### Trong phạm vi (In-Scope):
- Ứng dụng di động đa nền tảng React Native (Expo) sử dụng New Architecture và Native C++ AI execution (`react-native-vision-camera`, `react-native-fast-tflite`).
- Pipeline nhận diện đa luồng: MediaPipe Palm Detection SSD + CamShift Adaptive Hue Tracker + MobileNetV2 ASL Classifier.
- Quản lý gói mô hình linh hoạt: Nhập, giải nén, kiểm tra tính hợp lệ và xóa sạch gói mô hình (`packs/{id}/`).
- Các tính năng hỗ trợ: Quét qua Camera, quét qua Ảnh tĩnh (Picture), phân tích Video clip, quét thư mục hàng loạt (Batch).
- Phát âm thanh phản hồi (TTS), phản hồi rung xúc giác (Haptics), chế độ tối/sáng (Dark/Light theme) và đa ngôn ngữ (Tiếng Việt / Tiếng Anh).

### Ngoài phạm vi (Out-of-Scope):
- Huấn luyện mô hình trực tiếp trên điện thoại (việc huấn luyện thực hiện trên môi trường Python/GPU chuyên dụng).
- Nhận diện câu dài phức tạp có ngữ pháp biến đổi liên tục (giai đoạn hiện tại tập trung hoàn thiện cấp độ từ vựng/chữ cái/số).
- Đồng bộ hóa dữ liệu đám mây đa thiết bị (ưu tiên lưu trữ cục bộ bảo vệ quyền riêng tư người dùng).

---

## 5. ⚠️ Rủi ro & Giải pháp Kiểm soát (Risks & Mitigations)

| Rủi ro kỹ thuật | Mức độ | Giải pháp kiểm soát |
| :--- | :---: | :--- |
| **Quá nhiệt & Hao pin (Thermal Throttling)** | Trung bình | Tách biệt luồng theo dõi (Tracking 10 FPS) và luồng nhận diện (Recognition 1-2 FPS); cung cấp các chế độ tốc độ (Fast, Normal, Slow, Manual). |
| **Bàn tay rời khỏi khung hình hoặc nắm chặt** | Cao | Thuật toán CamShift với Mẫu động (Adaptive Hue) và trọng số mũ (Top-bias); tự động chuyển về trạng thái SEARCHING khi tay chạm mép viền. |
| **Xung đột bộ nhớ C++ JSI** | Cao | Sử dụng Nitro Modules quản lý vùng nhớ đệm, áp dụng `byteOffset` bóc tách chính xác Tensor; dọn dẹp cache ảnh khi unmount. |
| **Giới hạn môi trường Expo Go sandbox** | Thấp | Sử dụng Expo Prebuild và Custom Development Client (`npx expo run:android` / `eas build`) cho native C++ modules. |
