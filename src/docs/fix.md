# Nhật ký Nâng cấp Kiến trúc & Khắc phục Lỗi Hệ thống (Fix Log)

Tài liệu này ghi lại toàn bộ các cải tiến kiến trúc, thuật toán lõi và các bản vá lỗi quan trọng đã được triển khai thành công trong hệ thống nhận diện thời gian thực của ứng dụng **NLP2026 Sign Language Detector**.

---

## 1. 🚀 Kiến trúc Nâng cấp: Dual-Loop Autonomous Pipeline

### 1.1. Tách biệt Luồng Theo dõi (Tracking) & Luồng Nhận diện (Recognition)
- **Vấn đề trước đây:** Chạy trực tiếp mô hình phân loại ký tự trên mọi khung hình camera khiến CPU bị quá tải, gây tụt khung hình và nóng máy sau vài phút hoạt động.
- **Giải pháp:** Phân tách hoàn toàn thành 2 vòng lặp độc lập:
  1. **Luồng 1 (Tracking Loop - 10-15 FPS):**
     - Ở trạng thái `SEARCHING`: Dùng mô hình **MediaPipe Palm Detection SSD** (192x192) quét toàn màn hình để tìm vị trí bàn tay.
     - Khi phát hiện (`conf > 0.65`): Mở rộng hộp bao gấp 2.0x để ôm trọn ngón tay, chuyển sang trạng thái `TRACKING`.
     - Ở trạng thái `TRACKING`: Tắt AI MediaPipe để tiết kiệm pin; kích hoạt thuật toán **CamShift** bám đuổi vết màu da kết hợp Mẫu động (Adaptive Hue Histogram) và trọng số mũ (Exponential Top-bias).
  2. **Luồng 2 (Recognition Loop - 1-2 FPS):**
     - Chỉ kích hoạt khi Luồng 1 xác nhận đang ở trạng thái `TRACKING`.
     - Cắt đúng vùng ảnh vuông quanh bàn tay, tiền xử lý và nạp vào mô hình **MobileNetV2 ASL Classifier**.
     - Chạy bất đồng bộ qua `await tfliteModel.run()` trên C++ Background Thread Pool.

---

## 2. ⚡ Các Bản vá Lỗi Kỹ thuật Quan trọng

### Bug 01: Khắc phục Treo Hàng đợi Khung hình (Queue Starvation)
- **File:** `src/src/features/detection/hooks/useSignLanguageModel.ts`
- **Nguyên nhân:** Hàm `processLoop` được gọi một lần khi mount component lúc hàng đợi rỗng. Do điều kiện lặp đệ quy đặt bên trong nhánh `frameQueue.length > 0`, vòng lặp tự ngắt ngay lập tức và không bao giờ được kích hoạt lại khi có frame mới.
- **Giải pháp:** Thiết kế lại thành hàng đợi theo sự kiện (**Event-driven Worker Queue**). Khi `runDetection()` đẩy frame mới vào hàng đợi, nó trực tiếp đánh thức `processLoopRef.current()` nếu bộ xử lý đang rảnh. Khi xử lý xong một frame, nếu còn phần tử trong hàng đợi, nó tự lên lịch gọi frame kế tiếp qua `setTimeout(processLoop, 0)`.

### Bug 02: Rò rỉ Instance Native C++ khi Unmount (Stale Closure Leak)
- **File:** `src/src/features/detection/hooks/useHandDetection.ts`
- **Nguyên nhân:** Hàm dọn dẹp `useEffect` gọi `model?.release()`, nhưng biến `model` bị bắt trong closure khởi tạo ban đầu có giá trị `null`, khiến instance native C++ Fast-TFLite bị rò rỉ vĩnh viễn trong RAM.
- **Giải pháp:** Sử dụng `modelRef = useRef<any>(null)` để duy trì tham chiếu có thể thay đổi. Hàm unmount gọi `modelRef.current?.release()` đảm bảo giải phóng 100% tài nguyên C++.

### Bug 03: Rò rỉ Dung lượng Cache do Chụp Snapshot Liên tục
- **Files:** `useAutoDetection.ts`, `camShiftTracker.ts`, `useTestLogic.ts`, `usePracticeWordLogic.ts`
- **Nguyên nhân:** Camera chụp liên tục 10 FPS và ImageManipulator tạo ra các file JPEG trong thư mục cache, làm dung lượng app phình to sau thời gian ngắn sử dụng.
- **Giải pháp:** Bọc toàn bộ các thao tác xử lý ảnh trong khối `try ... finally` và gọi lệnh `FileSystem.deleteAsync(uri, { idempotent: true })` ngay lập tức để giải phóng đĩa cứng.

### Bug 04: Lệch Trạng thái Gói Mô hình khi Xóa (State Desync)
- **Files:** `useModelStore.ts`, `useModelManagerLogic.ts`
- **Nguyên nhân:** Khi xóa một model pack, nếu gói đó đang là gói được chọn (`activePackId`), store vẫn giữ nguyên ID cũ khiến màn hình Detection tìm kiếm file không tồn tại. Đồng thời từ vựng của gói cũ vẫn còn lưu trong AsyncStorage.
- **Giải pháp:** Cập nhật state updater để tự động gán `activePackId: null` nếu xóa gói đang active, và gọi `removePackWords(pack.id)` để dọn sạch từ vựng.

### Bug 05: Lỗi Truy cập Mảng Byte Không Canh Lề (ArrayBuffer Alignment)
- **File:** `src/src/features/detection/utils/modelOutputParser.ts`
- **Nguyên nhân:** Khởi tạo `Float32Array` từ buffer chia sẻ của C++ không chỉ định `byteOffset` hoặc có `byteLength` không chia hết cho 4, gây lỗi `RangeError`.
- **Giải pháp:** Khởi tạo view an toàn với `outputs[0].byteOffset || 0` và số phần tử là `Math.floor(outputs[0].byteLength / 4)`.

### Bug 06: Lỗi Xoay Ảnh và Kích thước trên Android (Image.getSize Failure)
- **Files:** `useDetectionLogic.ts`, `usePracticeLogic.ts`
- **Nguyên nhân:** Hàm `Image.getSize()` nguyên bản của React Native thường trả về `(0, 0)` hoặc thất bại trên Android do không đọc được metadata EXIF.
- **Giải pháp:** Chuyển sang sử dụng `ImageManipulator.manipulateAsync(uri, [])` giúp đọc kích thước và tự động chuẩn hóa góc quay ảnh chính xác 100%.

### Bug 07: Thừa Đệm An toàn ở Thanh Điều hướng Dưới (Double Safe Area Padding)
- **File:** `src/src/features/detection/screens/DetectionScreen.tsx`
- **Nguyên nhân:** Khai báo `edges={['top', 'left', 'right', 'bottom']}` trên màn hình con nằm bên trong BottomTabNavigator khiến giao diện bị thụt lên một khoảng trống vô lý ở đáy màn hình.
- **Giải pháp:** Đổi thành `edges={['top', 'left', 'right']}`, để đáy màn hình do BottomTabNavigator tự quản lý.

---

## 3. 🛡️ Quy chuẩn Ổn định Hệ thống
- **ErrorBoundary Toàn cục:** Đặt bọc ngoài `<AppNavigator />` trong [App.tsx](file:///d:/VScode/NLP2026/src/App.tsx) để bắt các lỗi runtime ngoại lệ mà không làm văng app.
- **Khả năng tương thích FileSystem:** Chuẩn hóa toàn bộ import sang `expo-file-system/legacy` để duy trì tính tương thích với Expo SDK 54.
- **Bản địa hóa Đầy đủ:** Bổ sung toàn bộ khóa ngôn ngữ trong [en.ts](file:///d:/VScode/NLP2026/src/src/core/i18n/locales/en.ts) và [vi.ts](file:///d:/VScode/NLP2026/src/src/core/i18n/locales/vi.ts).
