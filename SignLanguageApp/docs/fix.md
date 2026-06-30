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


## Kiến trúc Luồng Camera và Xử lý AI (Camera Pipeline)

Để giải quyết triệt để độ trễ (lag), hiện tượng mất dấu khi nắm tay, và tối ưu hóa hiệu năng, luồng xử lý hình ảnh được cấu trúc thành **Máy trạng thái (State Machine)** và **2 Vòng lặp (Loops)** chạy song song độc lập:

### 1. Luồng Theo dõi Mục tiêu (Tracking Loop)
- **Tốc độ:** Chạy liên tục tốc độ cao (10-15 FPS).
- **Mục đích:** Điều khiển Khung Xanh (Target Box) bám sát bàn tay. **Tuyệt đối KHÔNG** gọi AI phân tích chữ ở luồng này để tránh cản trở UI.
- **Quy trình Hoạt động:**
  - **[Giai đoạn 1] SEARCHING (Quét tìm):** Khi chưa có tay, hệ thống dùng AI `palm_detection` quét toàn màn hình. Khi phát hiện tay, lưu tọa độ và nhảy sang giai đoạn 2.
  - **[Giai đoạn 2] TRACKING (Khóa mục tiêu):** Tắt hoàn toàn AI `palm_detection`. Chuyển sang sử dụng thuật toán **CamShift** (thuần JS) để theo vết khối màu da.
- **Sức mạnh của CamShift (Xử lý nắm tay & ánh sáng):**
  - **Hệ màu HSV & Masking:** Chuyển đổi màu sang HSV, lọc bỏ hoàn toàn các điểm lóa (Flash) và vùng quá tối. Chỉ bám theo kênh Sắc độ (Hue) của da.
  - **Mẫu động (Adaptive Histogram):** Bộ nhớ màu da liên tục pha trộn thêm 5% màu thực tế ở mỗi khung hình. Giúp khung xanh không bị đứt đoạn khi người dùng đi từ phòng đèn trắng sang đèn vàng.
  - **Bám dính tuyệt đối:** Nhờ chỉ tính toán "Trọng tâm màu da", hệ thống không hề bị tuột khung ngay cả khi người dùng nắm chặt tay thành nắm đấm.
  - **Vật lý Lò xo (Spring UI):** Tọa độ xuất ra màn hình được bọc qua bộ giảm xóc Lò xo (`withSpring`). Khung Xanh sẽ lướt đi mềm mại như nước, hấp thụ mọi độ rung lắc của tay.
  - **Bảo vệ Tràn viền (Out-of-Bounds Crop Protection):** Bổ sung logic kìm kẹp (Clamp) giới hạn khung tìm kiếm (Search Window) của CamShift. Đảm bảo khu vực nội suy luôn nằm trọn vẹn bên trong độ phân giải của ảnh gốc, giải quyết triệt để lỗi crash hệ thống (`ImageManipulator`) khi tay di chuyển sát ra mép viền phải hoặc dưới của camera.
- **Ánh xạ Tọa độ Động (Dynamic Coordinate Mapping):** Khắc phục lỗi khung xanh bị lệch, méo và bám đuôi không chuẩn xác do ảnh hưởng của chế độ hiển thị `Cover` (cắt xén khung hình). Hệ thống tính toán trực tiếp hệ số tỷ lệ ảnh (`imageRatio`) và tự động nội suy mức độ Scale/Offset trên UI Thread (Reanimated). Nhờ vậy, tọa độ Tracking từ ảnh gốc được chuyển đổi mượt mà và chính xác tuyệt đối sang hệ quy chiếu của màn hình điện thoại.
- **Thoát (Reset):** Khi bàn tay di chuyển chạm vào mép camera (với biên độ an toàn `EDGE_MARGIN = 10px`), hệ thống sẽ lập tức nhận diện là Out of Bounds, hủy bỏ Khung Xanh, báo mất dấu và đưa quy trình quay về Giai đoạn 1. Điều này ngăn chặn triệt để hiện tượng thuật toán CamShift bám vào vân nền xung quanh hoặc sinh ra "bóng ma" khi tay đã rời khỏi khung hình.

### 2. Luồng Nhận diện Ngôn ngữ (Sign Recognition Loop)
- **Tốc độ:** Chạy ngầm tốc độ thấp (2-3 FPS).
- **Mục đích:** Cắt ảnh và gọi AI phân loại ký tự (A, B, C...) mà không làm khựng màn hình.
- **Quy trình Hoạt động:**
  - Liên tục nghe ngóng Luồng 1. Nếu Luồng 1 báo cáo đang **TRACKING**, Luồng 2 sẽ trích xuất tọa độ Khung Xanh hiện hành.
  - Chụp Snapshot và gọi `ImageManipulator` cắt (Crop) chuẩn một bức ảnh `224x224` chứa đúng bàn tay. Việc này chỉ thực hiện **ĐÚNG 1 LẦN**, triệt tiêu được 300ms xử lý thừa thãi trước đây.
  - Thay vì dùng `runSync` khóa cứng màn hình, hệ thống gọi `await tfliteModel.run()` để tống toàn bộ gánh nặng tính toán hàng triệu phép tính ma trận sang Background Thread (C++ Thread Pool). 
  - Giao diện (JS Thread) nhờ vậy luôn rảnh tay để đảm bảo khung xanh di chuyển mượt mà 60 FPS.



## Thành phần Agentic AI: Vòng lặp Suy luận (Kiến trúc Nâng cấp)

Kiến trúc Agentic AI được thiết kế theo mô hình tự chủ (Autonomous Pipeline), đảm bảo tối ưu hóa hiệu năng, chống nhiễu (flickering) và mang lại trải nghiệm thời gian thực tốt nhất cho thiết bị di động:

1. **Quan sát (Observation & Throttling)**: 
   - Thu nhận ảnh liên tục từ camera/thư viện/video.
   - Áp dụng **Adaptive Framerate**: Tự động giảm tốc độ nạp ảnh (Throttle) nếu phát hiện thiết bị bị nóng hoặc CPU quá tải.
2. **Kiểm tra điều kiện (Smart Validation)**: 
   - Kiểm tra tài nguyên: `packId` hợp lệ? `modelReady` (đã load xong)?
   - Quản lý nghẽn cổ chai (Backpressure): Đảm bảo `queue < 10`. Nếu hàng đợi đầy, áp dụng chiến lược **Drop Frame** (bỏ ảnh cũ nhất, nạp ảnh mới nhất) để độ trễ luôn tiệm cận 0ms.
   - Không xử lý trùng lặp (`URI` trùng).
3. **Hành động (Action & Queueing)**: 
   - Đẩy frame hợp lệ vào `frameQueue` (hoạt động như một Priority Queue). 
   - Đánh thức bộ xử lý: Gọi `processQueue()` nếu luồng đang ở trạng thái rảnh (Idle).
4. **Suy luận (Asynchronous Inference)**: 
   - Tiền xử lý ảnh (Squash Transform 1:1, Normalization).
   - TFLite Forward pass: Chạy suy luận hoàn toàn trên **C++ Background Thread** (thông qua Nitro Modules) trả về vector 29 chiều, giải phóng 100% JS Thread.
5. **Ra quyết định (Decision & Temporal Smoothing)**: 
   - Ngưỡng lọc cứng (Hard Threshold): Chấp nhận dự đoán chỉ khi `maxVal > 0.5`.
   - **Lọc nhiễu thời gian (Temporal Smoothing)**: Hệ thống phải nhận diện ra *cùng một ký tự* trong ít nhất 2-3 frames liên tiếp mới chốt kết quả hiển thị. Điều này triệt tiêu hoàn toàn bóng ma (Ghosting) và nhiễu sóng (Flickering).
6. **Phản hồi có điều kiện (Smart Feedback & Cooldown)**: 
   - Điều kiện: `conf > 0.8`.
   - Thay vì dùng `rand() < 0.1` (phản hồi hên xui), hệ thống áp dụng cơ chế **Cooldown/Debounce (Ví dụ: 2 giây)**. Nếu người dùng giữ tay ở ký tự 'A', máy chỉ rung/đọc TTS 1 lần và khóa âm thanh 'A' trong 2 giây tới để không gây ồn ào. Nếu đổi sang 'B', phản hồi diễn ra lập tức -> Gọi `Haptic` + `TTS` + `Lịch sử`.
7. **Lặp vòng (Non-blocking Loop & Telemetry)**: 
   - Lặp đệ quy qua `setTimeout(() => processQueue(), 0)` để trả lại thời gian tính toán cho UI Event Loop (giúp UI không bao giờ bị đơ).
   - Ghi nhận Metrics (FPS, Inference time) để Agent tự học và điều chỉnh nhịp điệu của vòng lặp.

**Ví dụ thực tế:**
`t=1.52s`: AI nhận diện 'A' (0.92 > 0.5) trong 3 frames liên tiếp -> UI chốt hiển thị 'A - 92%'.
Xét phản hồi: 0.92 > 0.8 VÀ 'A' chưa được đọc trong 2s qua -> Kích hoạt Haptic + Đọc TTS('A') + Lưu Lịch sử. Đặt Cooldown cho 'A'.

- Lỗi:
  - mode Auto: dùng chung logic với mode live (có speed từ fast,normal,slow,off) dẫn tới việc hoạt động ko đúng, refactor lại