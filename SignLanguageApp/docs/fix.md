# Auto Mode - Thiết Kế & Logic Xử Lý Bắt Tay Thời Gian Thực (Autonomous Pipeline)

## Công nghệ & Kỹ thuật cốt lõi

- **Trích xuất & Tiền xử lý ảnh (Expo Camera + ImageManipulator)**: Thay vì dùng C++ Frame Processor dễ gây неста/crash JSI, hệ thống sử dụng thuật toán `takeSnapshot` kết hợp với bộ đếm nhịp (Throttling) ở mức **10 FPS** trên JS Thread. Ảnh snapshot hình chữ nhật được đưa qua `ImageManipulator` để thực hiện kỹ thuật **Squash Transform (Ép tỷ lệ 1:1, tuyệt đối không Crop)** về chuẩn 192x192. Kỹ thuật này giúp mô hình quét được 100% diện tích màn hình mà không bị mất vùng rìa.
- **Inference Engine (react-native-fast-tflite Nitro V3)**: Tải và chạy song song 2 mô hình (MediaPipe Palm Detection & MobileNetV2 Sign Language) hoàn toàn Offline (On-device). Sử dụng sức mạnh của **C++ Nitro Modules** để đọc dữ liệu thô. Đặc biệt, áp dụng kỹ thuật **Memory Offset Parsing** (`view.byteOffset`) trực tiếp trên `ArrayBuffer` dùng chung của C++ để bóc tách chính xác các Tensor Output mà không bị rác bộ nhớ (Garbage Values).
- **Thuật toán giải mã SSD & Chuẩn hóa (Normalization)**: Tích hợp logic bóc tách Bounding Box độc quyền của MediaPipe (SSD Anchors 2016 ô neo). Dữ liệu ảnh đầu vào được chuẩn hóa màu chính xác theo dải **[0, 1]** để triệt tiêu hiện tượng Exploding Activations (Điểm logit vọt lên 900+). Hệ thống cũng tự động nhận diện Tensor dạng **Pre-activated Probability** để chặn đứng lỗi Fake Detection (Bóng ma).
- **UI & Tracking mượt mà (React Native Reanimated)**: Tọa độ tỷ lệ `[0..1]` từ AI được nhồi thẳng vào các **Shared Values**. Component hiển thị khung xanh (`AutoModeBoundingBox`) sử dụng Hook `onLayout` để đo kích thước pixel thực tế của Container, sau đó nhân với tỷ lệ để nội suy ra tọa độ vật lý. Nhờ chạy hoàn toàn trên **UI Thread** bằng C++, khung xanh bám dính lấy tay người dùng lập tức (0ms delay) kể cả khi JS Thread đang bận tính toán mô hình.

## Thiết kế Auto Mode

### 1. Kiến trúc Hệ Thống

- Kiến trúc xử lý luồng dữ liệu (Data Pipeline) được chia làm 3 tầng chuyên biệt nhằm tối ưu hóa hiệu năng:
  + **Tầng 1: JS Thread (Bộ Điều Phối - Orchestrator)**:
    - Loại bỏ hoàn toàn kiến trúc Máy Trạng Thái (State Machine cũ) gây giật cục. Hệ thống vận hành theo cơ chế vòng lặp liên tục (Continuous Loop).
    - Trích xuất ảnh (takeSnapshot) với tần số 10 FPS để tránh vắt kiệt CPU/Pin thiết bị.
    - Gọi API ImageManipulator để ép (Squash) ảnh về chuẩn 192x192 và chuẩn hóa mảng màu Float32 về dải `[0, 1]`.
    - Tính toán Tọa độ Hộp neo (SSD Decoding). Đặc biệt áp dụng thuật toán **Bành trướng Hộp (Bounding Box Expansion)**: Nhân tỷ lệ khung xanh lên 1.5 lần và thêm đệm (Padding) để biến nó thành một hình vuông hoàn hảo, ôm trọn các ngón tay.
    - Truyền tỷ lệ `[0..1]` vào Reanimated Shared Values, đồng thời cắt (Crop) ảnh truyền vào Mô hình Sign Language.
  + **Tầng 2: Native C++ Core (Lõi AI)**:
    - Tiếp nhận mảng Byte thuần (ArrayBuffer) từ JS thông qua JSI (JavaScript Interface).
    - Thực thi suy luận mô hình MediaPipe Palm Detection cực nhanh bằng TFLite XNNPACK/GPU Delegate.
    - Trả về thẳng bộ nhớ C++ (Pointers) cho 2 Tensors: Regressors và Classifiers, ngăn ngừa tắc nghẽn bộ nhớ.
  + **Tầng 3: UI Thread (Hiển Thị Đồ Họa)**:
    - Lắng nghe sự kiện từ Shared Values (Reanimated) để nội suy tọa độ Khung xanh theo tỷ lệ phần trăm của Camera Container (`onLayout`).
    - Render và di chuyển khung ở tốc độ chuẩn 60-120Hz hoàn toàn không bị ảnh hưởng bởi độ trễ tính toán mô hình ở JS Thread.

### 2. Giao Diện Đồ Họa (UI & Layout)

- **Các thành phần UI chủ chốt (Features):**
  - **Dynamic Square Box (Khung Tracking Vuông 1.5x):** Một khung ngắm linh hoạt tự động xuất hiện và bám sát bàn tay người dùng trên thời gian thực. Khung được lập trình để luôn giữ form hình vuông và mở rộng gấp rưỡi để không bao giờ chém đứt ngón tay người dùng. Toàn bộ khu vực này sẽ được Crop để đẩy vào mô hình nhận diện ký tự.
  - **Status Indicator:** Huy hiệu trạng thái nhỏ đính kèm dưới khung ngắm, thông báo theo thời gian thực (Real-time feedback) trạng thái của máy quét (Đang tìm, Đã khóa, hoặc Hiển thị ký tự được nhận diện).

- **Các thành phần đã bị loại bỏ (Deprecations):**
  - Loại bỏ hoàn toàn **Khung quét tĩnh (Static Center Box)**: Do AI hiện tại đã có khả năng quét và quét toàn bộ (Full-screen scan) không gian Camera, người dùng không còn bị ép buộc phải giơ tay vào đúng giữa màn hình nữa. Tay nằm ở góc nào, Khung Tracking sẽ chạy tới đó.

- **Các lỗi UI/UX đã được khắc phục triệt để (Resolved Bugs):**
  - **Lỗi vô hình (Box không hiển thị):** Xảy ra khi bàn tay nằm ở rìa màn hình. Đã fix bằng kỹ thuật **Squash Transform** (ép tỷ lệ camera thay vì cắt bỏ vùng rìa), giúp AI nhìn thấy toàn cảnh 100%.
  - **Lỗi khung bị kẹt ở tâm màn hình:** Xảy ra do thuật toán cũ nhân sai tọa độ tuyệt đối với `SCREEN_WIDTH` và `SCREEN_HEIGHT`. Đã fix bằng **Hệ trục tọa độ Tương đối (Relative Ratios)** kết hợp với `onLayout` để đo đạc chuẩn xác không gian Camera vật lý.

### 3. Luồng xử lý 

#### Luồng 1: Giai đoạn Khởi Tạo (AI Detection Initialization)

- **Trạng thái Tìm kiếm (Searching):** 
  - Hệ thống ở trạng thái rình rập, sử dụng **MediaPipe Palm Detection** (AI) quét với tần số thấp (10 FPS) để tìm "Lòng bàn tay" đang xòe.
  - Ngay khi phát hiện được bàn tay (Logit > Threshold), AI sẽ đóng khung Bounding Box đầu tiên.
- **Chuyển giao Quyền lực (Handoff):**
  - Tọa độ Bounding Box ban đầu được xem là **Tọa độ Neo (Anchor Box)**.
  - Hệ thống lập tức **tạm ngủ (Sleep)** mô hình AI MediaPipe để giải phóng CPU.
  - Khởi động bộ máy **Object Tracker** (Thuật toán toán học bám vết Pixel) và nạp Tọa độ Neo vào cho nó.

#### Luồng 2: Giai đoạn Theo Vết & Nhận Diện (Object Tracking & Classification)

- **Bám sát siêu tốc (Real-time Tracking):**
  - Object Tracker (dự kiến dùng OpenCV CSRT/KCF hoặc thuật toán dời Pixel) hoạt động độc lập ở tần số cao (30-60 FPS). 
  - Nó không dùng AI mà so sánh sự dịch chuyển màu sắc, khối lượng pixel của bàn tay giữa các Frame liên tiếp để dời khung xanh theo. Dù người dùng nắm tay, rụt ngón, xoay cổ tay, khung ngắm vẫn bám dính như nam châm.
  - Tọa độ mới được nạp liên tục vào Reanimated Shared Values để đẩy lên giao diện.

- **Thu hoạch Ký tự (Continuous Classification):**
  - Dựa trên tọa độ của Tracker, hàm Cropper liên tục cắt ảnh (10 lần/giây) ném vào mạng AI thứ hai: **Sign Language Classifier**.
  - Ký tự được dịch ra liên tiếp lên màn hình mà không hề có độ trễ giật cục.

- **Cơ chế Fallback (Chống trôi khung - Anti-Drift):**
  - *Lỗ hổng của Tracker:* Nếu tay di chuyển quá nhanh hoặc đi ngang qua vật thể trùng màu (khuôn mặt), khung xanh có thể bám nhầm và trôi đi mất (Drift).
  - *Giải pháp:* Nếu mô hình Sign Language báo cáo điểm tự tin (Confidence) thấp hơn 20% trong 3 giây liên tiếp (nghĩa là khung xanh đang cắt vào vùng không có ý nghĩa), hệ thống sẽ **Tiêu diệt Tracker**, xóa khung xanh, và đánh thức AI MediaPipe dậy (Quay lại Luồng 1) để tìm bàn tay lại từ đầu.