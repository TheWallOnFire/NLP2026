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
  - **Chuyển động giật cục (Robotic Tracking):** Khung xanh từng bị giật và cứng nhắc khi tay di chuyển nhanh do dùng `withTiming` (tuyến tính). Đã nâng cấp lên hệ thống **Vật lý Lò xo (Spring Physics)** với `withSpring(damping: 15, stiffness: 120, mass: 0.8)`. Giờ đây khung ngắm bám dính vào tay một cách tự nhiên, hữu cơ như nam châm từ tính.

### 3. Luồng xử lý 

#### Vòng Lặp Tự Động Toàn Diện (Continuous Auto-Detection Loop)

Toàn bộ hệ thống giờ đây được vận hành trên một Vòng lặp duy nhất (Single Loop) cực kỳ kiên cố, chạy ngầm với tần số **10 FPS** (10 lần mỗi giây) mang lại trải nghiệm mượt mà không độ trễ. Vòng lặp bao gồm 3 bước thực thi liên hoàn:

- **Bước 1: Khởi tạo Target Box (Định vị & Tracking):** 
  - *Tìm vị trí tay:* Từng Frame ảnh được ép (Squash) về 192x192 và nạp vào MediaPipe. Hệ thống dò tìm trong 2016 ô neo (SSD Anchors) để chọn ra ô có Logit cao nhất, từ đó bóc tách độ lệch tâm (`dx, dy`) và kích thước thô (`w, h`).
  - *Tính kích thước Box:* Tọa độ thô được đẩy qua thuật toán **Bounding Box Expansion**. Nó chọn cạnh dài nhất của tay, nhân hệ số 1.5x và cộng đệm 40px, nắn mọi thứ thành một **Hình vuông hoàn hảo** đủ sức chứa mọi dáng xòe ngón tay.
  - *Tracking:* Tọa độ hình vuông này được quy đổi về tỷ lệ `[0..1]` và đẩy sang Reanimated. Khung ngắm (Target Box) trên màn hình lập tức lướt theo bàn tay bạn trơn tru mượt mà.

- **Bước 2: Bộ Adapter xử lý Ảnh (Crop & Resize Input):**
  - *Cắt ảnh (Crop):* `ImageManipulator` dùng đúng tỷ lệ `[0..1]` của Target Box áp lên bức ảnh Camera gốc (độ phân giải cao) để cắt ra một mảnh hình vuông chứa tay.
  - *Đồng bộ Input Model (Adapter):* Bức ảnh vừa cắt có thể to nhỏ thất thường (phụ thuộc việc tay xa hay gần). Bộ Adapter sẽ lập tức **Resize** tấm ảnh vuông này về đúng "size tiêu chuẩn" mà Sign Language Model yêu cầu (thường là `224x224` hoặc `128x128`). Cuối cùng, ảnh được chuẩn hóa mảng màu Float32 để làm mồi cho AI.

- **Bước 3: Phiên dịch Ký tự (Sign Classification):**
  - Mảnh ảnh chuẩn `224x224` được nạp thẳng vào mạng nơ-ron **MobileNetV2**.
  - Ký tự nhận diện được (kèm theo % độ tự tin) lập tức hiển thị lên màn hình. Toàn bộ chu trình (từ quét tay -> tạo Box -> Adapter ảnh -> ra chữ) diễn ra liên tục 10 lần mỗi giây, mang lại cảm giác mượt mà tuyệt đối mà không có bất kỳ khoảng giật cục (Locking) nào.

### 4. Các lỗi Thuật Toán & Logic đã khắc phục (Algorithmic Fixes)

- **Lỗi Bóng Ma (Fake Detection / Exploding Activations):** Hệ thống liên tục nhận diện ra tay dù không có người ở đó, điểm Logit vọt lên con số không tưởng `922.0`. Đã khắc phục bằng 2 nhát chém:
  1. **Sửa C++ Memory Sharing:** Các Tensors của TFLite Nitro trỏ chung vào 1 khối RAM (ArrayBuffer). Việc đọc thẳng mảng mà không áp dụng `view.byteOffset` đã khiến hệ thống nhầm tọa độ `dx, w` thành điểm Logit.
  2. **Sửa Chuẩn hóa dải màu (Color Normalization):** Mô hình được Train trên dải màu `[0, 1]`, nhưng code cũ lại chuẩn hóa `[-1, 1]`. Sự sai lệch Input này khiến các Neural Layer bị "nổ tung". Đổi hệ số về `[0, 1]` đã lập tức triệt tiêu hoàn toàn Bóng Ma.

- **Lỗi Tuột khung khi Nắm tay (Fist Drop):** Mô hình `palm_detection` kén dáng tay, dễ tuột khung khi tay nắm lại. Đã khắc phục bằng thuật toán **Hysteresis Tracking (Ngưỡng đệm)**: Yêu cầu ngưỡng cao (`0.65`) lúc tìm tay mới, nhưng tự động hạ sập ngưỡng (`0.2`) lúc đã bắt được mục tiêu. Nhờ vậy, khung xanh sẽ "cố chấp" dính chặt lấy bàn tay kể cả khi người dùng nắm đấm lại làm tụt điểm Logit.


Xử lý logic tracking bàn tay với việc nắm bàn tay sẽ mất dấu thì làm như sau thì sao:
1.  Khi màn hình ko có tay sẽ tự tìm bàn tay bằng vòng lặp tìm bàn tay (Sử dụng AI), nếu detect được tay thì vào bước 2.
2.  Sau khi tìm được bàn tay sẽ khóa vị trí, đánh dấu lại trên màn hình bằng target box, vào vòng lặp track vị trí ở bước 3.
3.  Nếu bàn tay di chuyển thì sẽ di chuyển vị trí đánh dấu và target box trên màn hình theo bàn tay, dựa trên **Thuật toán CamShift**. Để đảm bảo không mất dấu bàn tay ngay cả khi nắm lại, và giải quyết triệt để sự thay đổi ánh sáng, thuật toán áp dụng:
    - **Hệ màu HSV:** Tách biệt và chỉ bám theo kênh `H` (Hue - Sắc độ màu da), bỏ qua sự thay đổi cường độ ở kênh `V` (Độ sáng) để tránh lóa hay chìm vào bóng tối.
    - **Lọc nhiễu độ sáng (Masking):** Bỏ qua các pixel quá đen hoặc quá chói lóa trước khi đưa vào tính toán, giúp tâm CamShift luôn ổn định.
    - **Mẫu động (Adaptive Histogram):** Liên tục pha trộn (update) 5% màu da thực tế ở mỗi frame mới vào Mẫu cũ, giúp Tracking "tiến hóa" từ từ khi người dùng đi từ phòng đèn trắng sang đèn vàng mà không bị đứt đoạn.
    - **Vật lý Lò xo (Spring Tracking UI):** Dù tọa độ ngầm bám tay với tỷ lệ 1:1, nhưng Khung xanh hiển thị (Target Box) được áp dụng bộ giảm xóc Lò xo (`withSpring`). Điều này biến chuyển động giật cục (Robotic) thành chuyển động trượt hữu cơ mềm mại, hấp thụ độ rung lắc của tay mà không làm sai lệch vùng ảnh Crop.
4.  **Điều kiện Thoát (Reset):** Khi bàn tay di chuyển khỏi khung camera, hoặc vào bóng tối hoàn toàn khiến diện tích vùng màu da của CamShift rơi về 0 (báo mất dấu), hệ thống sẽ tự động Reset lại: xóa vị trí, gỡ Target Box và quay về Bước 1.

lỗi:
- khi khóa được bàn tay, khoảng 1s -2s sau mới bắt đầu nhận diện được.