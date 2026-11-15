# Phân tích 30 Lỗi, Giới hạn & Rủi ro Tiềm ẩn trong Hệ thống Live Detection

Một hệ thống Computer Vision chạy thời gian thực (Real-time Edge AI) trên thiết bị di động luôn đối mặt với nhiều giới hạn phần cứng, bộ nhớ và luồng đa tiến trình. Dưới đây là phân tích chi tiết 30 vấn đề nâng cao / edge-cases chia theo 7 nhóm chuyên sâu và giải pháp kỹ thuật đã áp dụng trong ứng dụng.

---

## Nhóm 1: Phần cứng, Hệ điều hành & Camera (Hardware & OS)

1. **Thermal Throttling (Quá nhiệt & Bóp xung CPU):**
   - *Nguy cơ:* Chạy liên tục TFLite và Frame Processor ở tốc độ cao (30 FPS) làm CPU/GPU nóng lên. Khi đạt ngưỡng nhiệt, Android/iOS tự động bóp xung khiến FPS tụt thảm hại và giật lag.
   - *Giải pháp:* Tách kiến trúc thành **Dual-Loop Pipeline**: Luồng Tracking chạy 10–15 FPS bằng thuật toán nhẹ CamShift, luồng nhận diện AI MobileNetV2 chỉ kích hoạt 1–2 FPS khi tay đã ổn định.

2. **Camera Initialization Race Condition:**
   - *Nguy cơ:* Nếu cắm/rút camera ngoài hoặc chuyển đổi ứng dụng nhanh, đối tượng `cameraRef` bị `null` giữa lúc đang chụp snapshot gây fatal crash.
   - *Giải pháp:* Kiểm tra nghiêm ngặt `cameraRef.current`, bắt `try/catch` mọi lệnh `takeSnapshot` và hỗ trợ fallback an toàn.

3. **Mất kết nối Camera dưới Background (Suspend):**
   - *Nguy cơ:* Ứng dụng bị hệ điều hành đóng băng (Suspend) khi đang scan, ống kính camera bị ngắt kết nối đột ngột ở tầng C++, khi quay lại có thể bị màn hình đen.
   - *Giải pháp:* Đăng ký lắng nghe sự kiện `AppState`. Khi app sang `inactive` hoặc `background`, lập tức dừng mọi timer, xả rỗng queue và tạm dừng camera.

4. **Thu hồi quyền Camera đột ngột:**
   - *Nguy cơ:* Người dùng thu hồi quyền camera trong Cài đặt hệ thống khi ứng dụng đang chạy nền.
   - *Giải pháp:* `useCameraPermission` tự động bắt trạng thái và render màn hình cảnh báo `Camera Access Required` kèm nút mở cài đặt hệ thống.

5. **Định dạng Pixel không tương thích (Pixel Format):**
   - *Nguy cơ:* Thiết bị trả về ảnh định dạng `YUV_420_888` thay vì `RGB`, khiến mô hình nhận mảng nhiễu màu xám xanh.
   - *Giải pháp:* Sử dụng `expo-image-manipulator` chuẩn hóa mọi snapshot về JPEG RGB trước khi nạp vào mảng nhị phân.

---

## Nhóm 2: Trí tuệ nhân tạo & Mô hình TFLite (AI & Models)

6. **Ép kiểu Mô hình Lượng tử hóa (Quantized INT8 vs FP32):**
   - *Nguy cơ:* Nạp mô hình INT8 vào bộ xử lý chỉ chia cho 255.0 của Float32 khiến dự đoán sai lệch hoàn toàn.
   - *Giải pháp:* Đọc thuộc tính `normalization` trực tiếp từ `metadata.json` của từng Model Pack (`[0, 1]`, `[-1, 1]`, `[0, 255]`) để tiền xử lý tương ứng.

7. **Lỗi Output Tensor đa chiều:**
   - *Nguy cơ:* Mô hình có output `[1, 1, 29]` hoặc `[1, 29]`, nếu truy cập sai chỉ số mảng sẽ gây crash thuật toán tìm `maxVal`.
   - *Giải pháp:* `parseInferenceOutput` kiểm tra mảng lồng nhau và tự động duỗi thẳng (flatten) về mảng 1D an toàn.

8. **Tận dụng CPU Multi-threading & Delegate:**
   - *Nguy cơ:* Chạy mô hình trên một nhân đơn lẻ gây nghẽn UI và hao pin.
   - *Giải pháp:* `react-native-fast-tflite` tích hợp sẵn delegate **XNNPACK**, tự động phân bổ đa luồng trên tập lệnh NEON/ARM64.

9. **Lỗi Alignment của ArrayBuffer:**
   - *Nguy cơ:* Chip xử lý ARM yêu cầu bộ nhớ phải được canh lề (Memory Alignment 4-byte/16-byte). Buffer lấy từ Hermes nếu không canh lề chuẩn dễ gây lỗi Segfault (Crash C++).
   - *Giải pháp:* Tạo `Float32Array` với tham số `byteOffset` và độ dài chẵn: `Math.floor(outputs[0].byteLength / 4)`.

10. **Lỗi Kích thước Động (Dynamic Tensor Shapes):**
    - *Nguy cơ:* Mô hình khai báo kích thước đầu vào động `[-1, 224, 224, 3]`.
    - *Giải pháp:* Đọc `input_shape` chuẩn từ `metadata.json` và ép kích thước ảnh cố định (224x224 hoặc 192x192) trước khi nạp vào tensor.

---

## Nhóm 3: Bộ nhớ C++, Hermes & Worklets (Memory & JSI)

11. **Phân mảnh Bộ nhớ Heap (Heap Fragmentation):**
    - *Nguy cơ:* Khởi tạo liên tục `Float32Array` lớn ở tần số cao gây phân mảnh Garbage Collection của Hermes.
    - *Giải pháp:* Giới hạn tần số nhận diện cử chỉ ở 1–2 FPS, tái sử dụng worker queue và giải phóng vùng nhớ ngay sau khi suy luận xong.

12. **Bao đóng C++ cũ khi Unmount (Stale Closures):**
    - *Nguy cơ:* Model TFLite được tạo trong effect nhưng closure giữ giá trị `null`, khi unmount không giải phóng được instance native C++.
    - *Giải pháp:* Lưu trữ `modelRef = useRef<any>(null)` và gọi `modelRef.current?.release()` trong hàm dọn dẹp của `useEffect`.

13. **Rò rỉ Bộ nhớ Cache Snapshot (Disk Storage Bloat):**
    - *Nguy cơ:* Mỗi giây gọi `takeSnapshot` tạo ra nhiều file JPEG trong thư mục tạm `cacheDirectory`, sau 10 phút ứng dụng chiếm hàng GB bộ nhớ.
    - *Giải pháp:* Bọc mọi thao tác xử lý snapshot trong `try ... finally` và gọi `FileSystem.deleteAsync(uri, { idempotent: true })` ngay lập tức.

---

## Nhóm 4: Thị giác Máy tính & Bám đuổi Mục tiêu (Vision & Optical Tracking)

14. **Hiện tượng Mất dấu khi Nắm tay (Fist Drop):**
    - *Nguy cơ:* Khi người dùng nắm tay (các chữ cái 'A', 'E', 'S', 'M', 'N', 'T'), diện tích lòng bàn tay bị co nhỏ, mô hình Palm Detection bị tụt confidence làm rơi khung theo dõi.
    - *Giải pháp:* Áp dụng cơ chế **Hysteresis Thresholding**: Ban đầu cần `conf > 0.65` để khóa mục tiêu, nhưng khi đã khóa thì chỉ cần `conf > 0.20` để tiếp tục duy trì. Kết hợp thuật toán CamShift bám theo màu da không phụ thuộc hình dáng ngón tay.

15. **Hiện tượng Trọng tâm trượt xuống Cánh tay (Arm Drift):**
    - *Nguy cơ:* Thuật toán màu da tính trung bình toàn bộ vùng cẳng tay, kéo khung xanh tụt xuống cổ tay thay vì bao trọn ngón tay.
    - *Giải pháp:* Bổ sung trọng số mũ (**Exponential Top-Bias Weighting**): Điểm ảnh ở 1/3 phía trên khung hình được nhân hệ số trọng tâm lên tới 20x.

16. **Nhiễu sáng chói và Bóng đổ (Specular Glare & Shadows):**
    - *Nguy cơ:* Ánh đèn phản xạ chói lóa trên da làm sai lệch không gian màu RGB.
    - *Giải pháp:* Chuyển đổi sang không gian màu **HSV**, lọc bỏ các điểm ảnh có $V < 10$ (tối đen) hoặc $V > 98$ đi kèm $S < 5$ (chói trắng), chỉ lấy giá trị Hue tinh khiết.

17. **Hiện tượng Trôi màu da theo Môi trường (Color Drift):**
    - *Nguy cơ:* Di chuyển qua các nguồn sáng khác nhau (đèn huỳnh quang, ánh sáng tự nhiên) làm màu sắc bàn tay thay đổi.
    - *Giải pháp:* Thuật toán **Adaptive Hue Histogram**: Liên tục cập nhật dải màu mẫu với tỷ lệ pha trộn 5% màu thực tế mỗi frame: `H_target = 0.95 * H_target + 0.05 * H_frame`.

18. **Bàn tay chạm mép viền Camera (Out-of-Bounds):**
    - *Nguy cơ:* Bàn tay di chuyển ra ngoài mép màn hình, cắt ảnh bị vượt quá giới hạn gây crash ứng dụng.
    - *Giải pháp:* Áp dụng `EDGE_MARGIN = 10px` và hàm chặn biên `clamp()`. Nếu bàn tay chạm sát viền, tự động reset trạng thái về `SEARCHING`.

---

## Nhóm 5: Trạng thái Ứng dụng & Điều hướng (State & Navigation)

19. **Cập nhật State trên Component đã Unmount:**
    - *Nguy cơ:* Lệnh bất đồng bộ nhận diện hoàn tất sau khi người dùng đã chuyển sang tab khác gây cảnh báo React memory leak.
    - *Giải pháp:* Kiểm tra `isMounted.current` trước mọi lệnh cập nhật state React.

20. **Xóa Gói Mô hình đang Hoạt động:**
    - *Nguy cơ:* Xóa model pack trong khi nó đang được chọn làm active pack khiến màn hình Detection tìm không thấy file.
    - *Giải pháp:* Trong `deletePack(id)`, tự động gán `activePackId: null` và xóa sạch từ vựng liên quan trong AsyncStorage.

---

## Nhóm 6: Phản hồi Âm thanh & Xúc giác (Audio & Haptics)

21. **Âm thanh Đọc đè nhau liên tục (TTS Chatter):**
    - *Nguy cơ:* Camera nhận diện liên tục cùng một chữ cái ở 10 FPS, TTS kích hoạt đọc liên tiếp gây tiếng ồn khó chịu.
    - *Giải pháp:* Áp dụng cơ chế **Debounce / Cooldown 2 giây**: Chỉ đọc khi ký tự thay đổi hoặc sau khi đã qua thời gian giãn cách.

22. **Lọc Nhiễu Nhấp nháy Kết quả (Temporal Smoothing):**
    - *Nguy cơ:* Do nhiễu khung hình, AI có thể nhảy chữ bất chợt trong 1 frame đơn lẻ.
    - *Giải pháp:* Kết quả chỉ được xác nhận hiển thị lên UI khi nhận diện cùng một chữ cái trong ít nhất 2–3 frames liên tiếp.

---

## Nhóm 7: Lưu trữ & Đóng gói Mô hình (Storage & Packaging)

23. **Tràn bộ nhớ khi Giải nén File ZIP lớn:**
    - *Nguy cơ:* Đọc file ZIP dạng chuỗi Base64 làm tăng gấp đôi dung lượng trong Hermes heap, gây crash Out-Of-Memory.
    - *Giải pháp:* Đọc file trực tiếp thành `ArrayBuffer` qua hàm `fetch(fileUri)` và truyền vào `JSZip.loadAsync()`.

24. **Dọn dẹp File ZIP Tạm sau khi Nhập:**
    - *Nguy cơ:* File ZIP tải từ DocumentPicker được lưu tạm vào cache và không bao giờ bị xóa.
    - *Giải pháp:* Thêm khối `finally` trong `packImporter.ts` để gọi `FileSystem.deleteAsync` ngay sau khi giải nén xong.
