# NLP2026 Sign Language Detector — Tech Stack

Tài liệu này mô tả chi tiết toàn bộ công nghệ, thư viện và kiến trúc phần cứng được triển khai trong dự án **NLP2026 Sign Language Detector**.

---

## 1. 📱 Mobile Application Frontend

| Lớp thành phần | Công nghệ / Thư viện | Phiên bản | Vai trò & Mục đích |
| :--- | :--- | :---: | :--- |
| **Nền tảng chính** | **React Native** + **Expo** | `0.81.5` / `SDK 54` | Phát triển ứng dụng di động đa nền tảng (Android / iOS) với Expo Prebuild. |
| **Ngôn ngữ** | **TypeScript** | `5.9.x` | Đảm bảo tính chặt chẽ về mặt kiểu dữ liệu, an toàn bộ nhớ và dễ bảo trì. |
| **Kiến trúc Native** | **New Architecture & Nitro Modules** | `0.35.9` | Tận dụng JSI (JavaScript Interface) và C++ Hybrid Objects cho giao tiếp không độ trễ. |
| **Điều hướng** | **React Navigation** | `v7.x` | Quản lý Bottom Tab (`MainTabs`) và Native Stacks (`Learning`, `Profile`, `Settings`, `History`). |
| **Bảo vệ Hệ thống** | **React Error Boundary** | Custom Class | Bọc toàn bộ AppNavigator, bắt lỗi runtime UI và hiển thị thông báo chẩn đoán thân thiện. |
| **State Management** | **Zustand** + `AsyncStorage` | `5.0.13` / `2.2.0` | Quản lý 5 stores (`Settings`, `Model`, `Learning`, `History`, `User`), tích hợp middleware `persist`. |
| **Giao diện & UI** | **React Native Paper** (MD3) | `5.15.2` | Hệ thống thành phần Material Design 3 hiện đại, hỗ trợ Dynamic Theme (Light/Dark). |
| **Icon System** | **Lucide React Native** | `1.14.0` | Bộ biểu tượng vector sắc nét, đồng bộ cho toàn bộ navigation và action buttons. |
| **Đa ngôn ngữ** | **i18next** + **react-i18next** | `26.3.2` / `17.0.8` | Bản địa hóa ứng dụng hoàn chỉnh sang Tiếng Anh (`en-US`) và Tiếng Việt (`vi-VN`). |
| **Đồ họa Động** | **React Native Reanimated** | `4.1.1` | Dùng SharedValues và Spring Physics (`withSpring`) vẽ khung xanh 60 FPS trên UI Thread. |

---

## 2. 🧠 On-Device AI & Computer Vision Engine

Hệ thống AI chạy hoàn toàn **Offline 100% trên thiết bị (Edge AI)** mà không cần gửi dữ liệu hình ảnh lên bất kỳ máy chủ nào:

| Thành phần | Thư viện / Mô hình | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **TFLite Runtime** | `react-native-fast-tflite` (v3.0.1) | Lõi thực thi TensorFlow Lite Native bằng C++, hỗ trợ CPU multi-threading và XNNPACK delegate. |
| **Bridge & Memory** | `react-native-nitro-modules` (v0.35.9) | Quản lý ArrayBuffer chia sẻ giữa C++ và JS runtime, loại bỏ hiện tượng garbage collection overhead. |
| **Xử lý Pixel C++** | `react-native-nitro-image` (v0.15.1) | Trích xuất pixel thô (RGBA/BGRA) từ ảnh và video siêu tốc độ ở tầng C++ (Zero-copy). |
| **Phát hiện bàn tay** | **MediaPipe Palm Detection (SSD)** | Model TFLite 192x192 với 2,016 ô neo (SSD Anchors), xác định vị trí bàn tay toàn màn hình. |
| **Theo dõi mục tiêu** | **CamShift Adaptive Tracker** | Thuật toán bám đuổi vết màu da theo không gian màu HSV kết hợp Mẫu động (Adaptive Hue Histogram). |
| **Phân loại ký hiệu** | **MobileNetV2 ASL Classifier** | Mạng nơ-ron tích chập (CNN) phân loại 29 nhãn ngôn ngữ ký hiệu ASL (A-Z, del, nothing, space). |
| **Hàng đợi Suy luận** | **Event-driven Worker Queue** | Hàng đợi phi khóa thức giấc ngay khi có frame, tránh starvation và không tốn chu kỳ CPU khi nhàn rỗi. |

---

## 3. 🔌 Native & Hardware Integrations

- **`react-native-vision-camera` (v5.0.11):** Quản lý phần cứng máy ảnh tốc độ cao, khóa 30 FPS chống quá nhiệt, điều khiển đèn Flash và hỗ trợ snapshot capture.
- **`expo-speech` (v14.0.8):** Công cụ Text-to-Speech phát âm thanh đọc to ký tự/từ vựng được nhận diện theo thời gian thực (hỗ trợ cooldown chống đọc lặp).
- **`expo-haptics` (v15.0.8):** Cung cấp phản hồi xúc giác (rung) khi nhận diện thành công hoặc hoàn thành câu hỏi trong bài kiểm tra.
- **`expo-video` (v3.0.16) & `expo-video-thumbnails` (v10.0.8):** Xử lý phát video và trích xuất các khung hình (frames) cho tính năng phân tích video hàng loạt.
- **`expo-document-picker` (v14.0.8) & `jszip` (v3.10.1):** Cho phép người dùng chọn và giải nén các gói mô hình (`.zip` Model Packs) tùy chỉnh từ bộ nhớ máy qua ArrayBuffer.
- **`expo-file-system/legacy` (v19.0.23):** Quản lý tập tin lưu trữ, cache ảnh tạm thời, và cách ly thư mục của từng model pack (`packs/{id}/`).

---

## 4. 🐍 Python AI Training & Research Environment

| Thành phần | Thư viện | Mục đích |
| :--- | :--- | :--- |
| **Core Framework** | **TensorFlow 2.x** / Keras | Xây dựng, huấn luyện và fine-tune các kiến trúc MobileNetV2, EfficientNet. |
| **Xử lý ảnh** | **OpenCV (`cv2`)** & **Pillow (`PIL`)** | Cắt ảnh (Center Crop, Hand Crop), chuẩn hóa dải màu và biến đổi dữ liệu huấn luyện. |
| **Đánh giá mô hình** | **Scikit-learn** | Lập ma trận nhầm lẫn (Confusion Matrix) và báo cáo phân loại (Classification Report). |
| **Thu thập dữ liệu** | **Kaggle CLI** & `download_dataset.py` | Tải tự động bộ dữ liệu `grassknoted/asl-alphabet` từ Kaggle. |
| **Đóng gói Model** | `models/generator.py` | Tự động lượng tử hóa (Quantization) và đóng gói mô hình Keras thành định dạng `.zip` Model Pack di động. |
| **Bộ kiểm thử tự động**| `tests/test.py` (`--all`, `--run`) | Điều phối tự động toàn bộ 6 kịch bản kiểm thử mô hình và hình dạng tensor không cần người dùng can thiệp. |
| **Công cụ tiện ích** | `models/crop.py` (Tkinter GUI) | Ứng dụng desktop cho phép khoanh vùng và cắt ảnh nhanh phục vụ thu thập mẫu kiểm thử. |
