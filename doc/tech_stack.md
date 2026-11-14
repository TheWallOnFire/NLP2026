# NLP2026 Sign Language Detector — Tech Stack

Tài liệu này mô tả chi tiết toàn bộ công nghệ, thư viện và kiến trúc phần cứng được triển khai trong dự án **NLP2026 Sign Language Detector**.

---

## 1. 📱 Mobile Application Frontend

| Lớp thành phần | Công nghệ / Thư viện | Vai trò & Mục đích |
| :--- | :--- | :--- |
| **Nền tảng chính** | **React Native 0.81.5** + **Expo SDK 54** | Phát triển ứng dụng di động đa nền tảng (Android / iOS) với Expo Prebuild. |
| **Kiến trúc Native** | **New Architecture & Nitro Modules** | Tận dụng JSI (JavaScript Interface) và C++ Hybrid Objects cho giao tiếp không độ trễ. |
| **Ngôn ngữ** | **TypeScript 5.9** | Đảm bảo tính chặt chẽ về mặt kiểu dữ liệu, an toàn bộ nhớ và dễ bảo trì. |
| **State Management** | **Zustand 5.0** + `AsyncStorage` | Quản lý state nhẹ, ít boilerplate, tích hợp middleware `persist` lưu dữ liệu offline. |
| **Giao diện & UI** | **React Native Paper 5.15** (MD3) | Hệ thống thành phần Material Design hiện đại, hỗ trợ Dynamic Theme (Light/Dark/System). |
| **Icon System** | **Lucide React Native** | Bộ biểu tượng vector sắc nét, đồng bộ cho toàn bộ navigation và action buttons. |
| **Đa ngôn ngữ** | **i18next** + **react-i18next** | Bản địa hóa ứng dụng hoàn chỉnh sang Tiếng Anh (en-US) và Tiếng Việt (vi-VN). |

---

## 2. 🧠 On-Device AI & Computer Vision Engine

Hệ thống AI chạy hoàn toàn **Offline 100% trên thiết bị (Edge AI)** mà không cần gửi dữ liệu hình ảnh lên bất kỳ máy chủ nào:

| Thành phần | Thư viện / Mô hình | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **TFLite Runtime** | `react-native-fast-tflite` (v3) | Lõi thực thi TensorFlow Lite Native bằng C++, hỗ trợ CPU multi-threading và XNNPACK delegate. |
| **Bridge & Memory** | `react-native-nitro-modules` | Quản lý ArrayBuffer chia sẻ giữa C++ và JS runtime, loại bỏ hiện tượng garbage collection overhead. |
| **Xử lý Pixel C++** | `react-native-nitro-image` | Trích xuất pixel thô (RGBA/BGRA) từ ảnh và video siêu tốc độ ở tầng C++ (Zero-copy). |
| **Phát hiện bàn tay** | **MediaPipe Palm Detection (SSD)** | Model TFLite 192x192 với 2016 ô neo (SSD Anchors), xác định vị trí bàn tay toàn màn hình. |
| **Theo dõi mục tiêu** | **CamShift Adaptive Tracker** | Thuật toán bám đuổi vết màu da theo không gian màu HSV kết hợp Mẫu động (Adaptive Hue Histogram). |
| **Phân loại ký hiệu** | **MobileNetV2 ASL Classifier** | Mạng nơ-ron tích chập (CNN) phân loại 29 nhãn ngôn ngữ ký hiệu ASL (A-Z, del, nothing, space). |
| **Đồ họa Tracking** | `react-native-reanimated` (v4) | Dùng SharedValues và Spring Physics (`withSpring`) vẽ khung xanh 0ms delay trên UI Thread. |

---

## 3. 🔌 Native & Hardware Integrations

- **`react-native-vision-camera` (v5):** Quản lý phần cứng máy ảnh tốc độ cao, điều khiển đèn Flash, chuyển đổi Camera trước/sau và hỗ trợ capture frames.
- **`expo-speech`:** Công cụ Text-to-Speech phát âm thanh đọc to ký tự/từ vựng được nhận diện theo thời gian thực.
- **`expo-haptics`:** Cung cấp phản hồi xúc giác (rung) khi nhận diện thành công hoặc trả lời đúng trong bài kiểm tra.
- **`expo-video` & `expo-video-thumbnails`:** Xử lý phát video và trích xuất các khung hình (frames) cho tính năng phân tích video hàng loạt.
- **`expo-document-picker` & `jszip`:** Cho phép người dùng chọn và giải nén các gói mô hình (`.zip` Model Packs) tùy chỉnh từ bộ nhớ máy.
- **`expo-file-system`:** Quản lý tập tin lưu trữ, cache ảnh tạm thời, và cách ly thư mục của từng model pack (`packs/{id}/`).

---

## 4. 🐍 Python AI Training & Research Environment

| Thành phần | Thư viện | Mục đích |
| :--- | :--- | :--- |
| **Core Framework** | **TensorFlow 2.x** / Keras | Xây dựng, huấn luyện và fine-tune các kiến trúc MobileNetV2, EfficientNet. |
| **Xử lý ảnh** | **OpenCV (`cv2`)** & **Pillow (`PIL`)** | Cắt ảnh (Center Crop, Hand Crop), chuẩn hóa dải màu và biến đổi dữ liệu huấn luyện. |
| **Đánh giá mô hình** | **Scikit-learn** | Lập ma trận nhầm lẫn (Confusion Matrix) và báo cáo phân loại (Classification Report). |
| **Thu thập dữ liệu** | **Kaggle CLI** & `download_dataset.py` | Tải tự động bộ dữ liệu `grassknoted/asl-alphabet` từ Kaggle. |
| **Đóng gói Model** | `models/generator.py` | Tự động lượng tử hóa (Quantization) và đóng gói mô hình Keras thành định dạng `.zip` Model Pack di động. |
| **Công cụ tiện ích** | `models/crop.py` (Tkinter GUI) | Ứng dụng desktop cho phép khoanh vùng và cắt ảnh nhanh phục vụ thu thập mẫu kiểm thử. |
