# Danh sách 30 Lỗi, Giới hạn & Rủi ro tiềm ẩn trong Live Mode (Camera)

Mặc dù các luồng logic cốt lõi đã được vá hoàn thiện, một hệ thống Computer Vision chạy theo thời gian thực (Real-time) trên thiết bị di động luôn tiềm ẩn những "góc khuất" do giới hạn phần cứng, thư viện bên thứ 3 và luồng đa tiến trình. Dưới đây là danh sách phân tích 30 vấn đề nâng cao/edge-cases chia theo 7 nhóm chuyên sâu.

## Nhóm 1: Phần cứng, Hệ điều hành & Camera (Hardware & OS)
1. **Thermal Throttling (Quá nhiệt):** Chạy liên tục TFLite và Frame Processor ở tốc độ cao sẽ làm CPU/GPU nóng lên. Khi đạt ngưỡng nhiệt độ, hệ điều hành Android/iOS sẽ tự động bóp hiệu năng (Throttling), khiến FPS tụt thê thảm và giật lag màn hình.
2. **Camera Initialization Race Condition:** Nếu cắm/rút camera ngoài (OTG) hoặc chuyển đổi ứng dụng quá nhanh, đối tượng `device` bị `null` giữa lúc Worklet đang chạy có thể gây Fatal Native Crash.
3. **Mất kết nối Camera dưới Background:** Nếu app bị hệ điều hành đóng băng (Suspend) khi đang Live Scan, ống kính camera bị ngắt kết nối đột ngột ở tầng C++, khi quay lại app có thể bị treo đen màn hình.
4. **Mất quyền Camera đột ngột:** Người dùng ẩn app, vào Cài đặt hệ thống thu hồi quyền Camera, rồi mở lại app. Frame Processor không có cơ chế bắt lỗi Security Exception sẽ gây sập app tức tì.
5. **Định dạng Pixel không tương thích (Pixel Format):** Nếu thiết bị tầm trung trả về ảnh dạng `YUV_420_888` thay vì `RGB`, bộ Resizer có thể cắt sai cấu trúc byte, khiến ML Model nhận một mảng nhiễu màu xám xanh.

## Nhóm 2: Machine Learning & TFLite (AI & Models)
6. **Lỗi ép kiểu Model Quantized (INT8/Float16):** Thuật toán hiện tại đang ép cứng chia `255.0` và dùng `Float32Array`. Nếu nạp một model được nén dạng INT8 (chỉ nhận số nguyên -128 đến 127), AI sẽ dự đoán sai hoàn toàn.
7. **Lỗi Tensor Đa chiều (3D/4D Temporal):** Nếu TFLite Output là chuỗi thời gian `[1, 10, N]` thay vì `[1, N]`, biến `outputData` sẽ trở thành một mảng của các mảng, làm gãy code thuật toán tìm `maxVal`.
8. **Chưa tận dụng GPU/NNAPI Delegation:** Cấu hình TFLite đang chạy thuần túy bằng CPU. Nó không khai thác NPU (Neural Processing Unit) hay GPU tích hợp của điện thoại, gây hao pin gấp 3 lần bình thường.
9. **Lỗi Alignment của ArrayBuffer:** Chip ARM đòi hỏi bộ nhớ phải canh lề (Memory Alignment - ví dụ 16-byte). Buffer lấy từ Hermes đôi khi không được canh lề chuẩn, dễ gây lỗi Segfault (Sập C++) ở một số dòng máy Xiaomi/Oppo.
10. **Lỗi cấu hình Dynamic Shape:** Nếu Model dùng kích thước động `[-1, 224, 224, 3]`, biến `modelShape[1]` sẽ trả về `-1`. Resizer nhận `width=-1` sẽ gây tràn bộ nhớ đệm và crash máy ảnh.

## Nhóm 3: Rò rỉ bộ nhớ C++ & Worklets (Memory & JSI)
11. **Rác bộ nhớ do Fragmentation:** Dù đã tối ưu, nhưng việc khởi tạo `Float32Array(27648)` bên trong Worklet nếu chạy ở 60FPS vẫn làm phân mảnh vùng nhớ Heap của Hermes.
12. **Lỗi che đậy Exception (Masked Error):** Trong khối `try..finally` của Worklet, nếu `resizer.resize()` ném lỗi nổ C++, biến `resized` sẽ là `undefined`. Khối `finally` gọi `resized.dispose()` sẽ văng thêm lỗi "Cannot read property 'dispose' of undefined", che khuất lỗi gốc.
13. **Leak Frame khi Resize thất bại:** Tương tự lỗi trên, nếu `resized.dispose()` văng lỗi, hàm `frame.dispose()` nằm ở khối `finally` ngoài cùng có thể bị gián đoạn, làm treo cứng Frame của Camera.
14. **Quá tải JNI Local Reference:** Việc gọi `boxedModel.unbox()` tạo ra một HostObject liên tục. Bộ dọn rác (GC) đôi lúc gom rác chậm hơn tốc độ tạo ra, khiến bộ đếm JNI vượt mốc 512 references gây sập ứng dụng (Dalvik Exception).

## Nhóm 4: Trạng thái & React Lifecycle (State Sync)
15. **Delay bất đồng bộ AppState:** Khi thoát ra màn hình chính, sự kiện `AppState` mất vài mili-giây để truyền đến React. Trong tích tắc đó, Camera vẫn bơm 1-2 khung hình vào Worklet lúc hệ thống đang ngắt mạng, dễ gây lỗi.
16. **Xung đột Unmount:** Nếu người dùng chuyển tab (Navigate away) đúng lúc `tflite.runSync` đang chặn UI Thread (mất 50ms), React cố gắng gỡ (Unmount) Camera view đang bận, sinh ra cảnh báo đỏ "Attempted to destroy a view that is in use".
17. **Race Condition lật Camera (Facing):** Khi bấm lật Camera, `facingSV` cập nhật lập tức nhưng ống kính phần cứng mất 0.5s để xoay. Các Frame cũ của Camera sau bị Worklet nhận nhầm là Camera trước và tự động lật ngược X-axis gây sai lệch tức thời.
18. **Stale Closure của Settings:** Cài đặt độ nhạy `thresholdValue` không được đưa vào SharedValue. Nếu người dùng đổi độ nhạy từ Settings, Worklet vẫn dùng độ nhạy cũ trừ khi Component Camera bị ép re-render hoàn toàn.
19. **Nghẽn cổ chai Bridge:** Nếu tốc độ nhận diện quá nhanh (ví dụ 30 FPS thành công liên tục), hàm `onDetectionJS` bắn dữ liệu lên JS Thread 30 lần/giây, làm nghẽn React Native Bridge và gây giật giao diện.

## Nhóm 5: UX & Khả năng tiếp cận (Accessibility)
20. **Thiếu Haptic Feedback khi lỗi:** Khi model bị hỏng (trả về NaN), app hiện Snackbar nhắc nhở nhưng không rung phản hồi. Người dùng khiếm thị hoặc không nhìn màn hình sẽ không nhận biết được thiết bị đã ngừng quét.
21. **Logic Đèn Flash bất đồng bộ:** Đang ở Camera sau (bật Flash), chuyển sang Camera trước (Flash tự tắt). Nếu chuyển lại Camera sau, Flash không tự động bật lại, khiến người dùng cảm thấy "mất trạng thái" (State Loss).
22. **Lệch pha Animation Quét:** Hiệu ứng vạch quét màu xanh lên xuống cố định mỗi 2 giây. Nhưng thực tế mô hình AI có thể nhận diện trong 100ms. Hiệu ứng đồ họa không đồng bộ với thời gian thực của máy học, tạo cảm giác "fake" (giả lập).
23. **Trải nghiệm Lag do Debounce:** Debounce 1000ms giúp giảm tải CPU, nhưng nếu người dùng làm xong 1 dấu và chuyển sang dấu thứ 2 trong 0.8s, app sẽ phớt lờ dấu thứ 2. UX sẽ có cảm giác ứng dụng bị "đơ" nhịp.

## Nhóm 6: Quang học & Xử lý Ảnh gốc (Optics & Pre-processing)
24. **Auto-focus Hunting:** Camera luôn cố gắng lấy nét liên tục (Continuous AF). Khi ống kính đang chạy mô-tơ lấy nét, ảnh bị nhòe (Blur), Worklet vẫn xử lý bức ảnh mờ này khiến AI trả về tự tin thấp hoặc sai hoàn toàn.
25. **Motion Blur trong điều kiện thiếu sáng:** Ở môi trường tối, Camera tự giảm tốc độ màn trập (Shutter Speed) để hút sáng. Hậu quả là tay vung nhẹ cũng tạo ra bóng mờ (Motion Blur). Ứng dụng không cảnh báo người dùng "Quá tối", AI thì vẫn đoán bừa.
26. **Lỗi Crop không khớp UI (ScaleMode Cover):** Tham số `scaleMode: 'cover'` của Resizer tự động cắt bỏ hai bên mép của camera 16:9 để lấy hình vuông 1:1. Nếu tay người dùng nằm ở sát mép viền, trên màn hình vẫn thấy tay, nhưng AI lại nhận một bức ảnh bị cắt cụt.
27. **Sai lệch chiều xoay dọc/ngang (Rotation/Orientation):** Khi xoay ngang điện thoại, UI tự xoay, nhưng ma trận Pixel của Camera vẫn giữ chiều dọc của phần cứng. Model AI nhận được hình ảnh "bàn tay nằm ngang" thay vì dựng đứng như lúc train.
28. **Tiêu thụ pin do FPS không khóa:** Không có thuộc tính cấu hình `format` cho Camera. Máy cao cấp có thể chạy ống kính ở 60Hz/120Hz, đẩy Frame Processor làm việc quá sức không cần thiết thay vì khóa cứng ở 30Hz.

## Nhóm 7: Rủi ro Build & Third-party (Babel/Vulkan)
29. **Reanimated Plugin Conflict:** Frame Processor của VisionCamera dựa chặt chẽ vào Babel plugin của Reanimated. Nếu nâng cấp thư viện mà quên xóa Cache Metro (`npm start -c`), Worklet sẽ âm thầm trả về `undefined` và tịt ngòi mà không báo lỗi.
30. **Lỗi Memory Leak của Vulkan API:** Trên một số máy Android tầm trung (như chip MediaTek/Mali), engine Vulkan của bộ `resizer` bị lỗi rò rỉ bộ nhớ VRAM. Thư viện thỉnh thoảng sập về chế độ xử lý bằng CPU, làm tốc độ app chậm đi 10 lần.
