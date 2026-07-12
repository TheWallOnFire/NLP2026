# NLP2026 Sign Language Detector — Tech Stack

## Mobile Frontend (Ứng dụng Di động)
- **Core Framework:** [React Native](https://reactnative.dev/) kết hợp với [Expo](https://expo.dev/) (phiên bản tương thích Expo Go).
- **Ngôn ngữ:** TypeScript
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (kết hợp với `AsyncStorage` để lưu trữ dữ liệu offline).
- **UI Components & Styling:** [React Native Paper](https://callstack.github.io/react-native-paper/) (Material Design UI), [Lucide React Native](https://lucide.dev/) (Thư viện icon).

## AI & Machine Learning (Trí tuệ Nhân tạo)
- **Inference Engine:** TensorFlow Lite (thực thi trên thiết bị di động với các file `.tflite`).
- **Data Processing & Training (Môi trường Python):** 
  - Ngôn ngữ: Python 3.8+
  - Các thư viện: TensorFlow, OpenCV (xử lý hình ảnh), MediaPipe (trích xuất đặc trưng tay/cơ thể).
  - Notebook: Jupyter Notebook cho việc nghiên cứu và thử nghiệm.

## Native & Hardware Integrations (Tích hợp phần cứng)
- `expo-camera`: Xử lý luồng video thời gian thực từ camera thiết bị.
- `expo-haptics`: Cung cấp phản hồi rung (tactile feedback).
- `expo-speech`: Chuyển đổi văn bản thành giọng nói (Text-To-Speech) sau khi nhận diện thành công.
- `expo-document-picker`: Cho phép người dùng tải các gói mô hình (`.zip`) từ bộ nhớ ngoài.
- `expo-file-system`: Thao tác đọc/ghi và giải nén các gói mô hình tùy chỉnh.
