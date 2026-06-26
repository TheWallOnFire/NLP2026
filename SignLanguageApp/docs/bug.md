# Báo Cáo Rủi Ro Kiến Trúc Nâng Cao: 50 Giới hạn Nền tảng & Edge Cases

Vì luồng logic (Logic Flow) của Auto Mode đã được tối ưu hoàn hảo, các lỗi thuật toán cơ bản đã không còn tồn tại. Dưới đây là danh sách 50 **Rủi ro Kiến trúc (Architectural Risks)** và **Giới hạn Hệ điều hành (OS Constraints)** sâu hơn ở cấp độ Native (C++/Java/Objective-C) có thể phát sinh khi ứng dụng Scale lên hàng triệu người dùng với vô vàn thiết bị khác nhau:

---

## I. Xung đột Phần cứng Camera & Cảm biến (Hardware Quirks)
1. **OIS Desync:** Hệ thống Chống rung quang học (OIS) trên các dòng iPhone Pro/Samsung Ultra dịch chuyển thấu kính vật lý, khiến tọa độ lấy từ `Frame Processor` và ảnh chụp thực tế `takeSnapshot` lệch nhau 2-5 pixel.
2. **Rolling Shutter Effect:** Khi người dùng vung tay quá nhanh, cảm biến CMOS quét từ trên xuống dưới gây méo hình bàn tay (bị kéo dài hoặc nghiêng), khiến AI đọc sai ký hiệu.
3. **Auto-Focus Hunt:** Camera liên tục tự động lấy nét (Auto-Focus) vào phông nền thay vì bàn tay, làm mờ tay và khiến logit của AI tụt thê thảm.
4. **Auto-Exposure Lag:** Khi đưa tay từ chỗ tối ra ngoài sáng, cảm biến mất 0.5s - 1s để cân bằng sáng (ISO/Shutter Speed), trong lúc đó ảnh bị cháy sáng (Whiteout) làm AI bị mù.
5. **Nhiễu hạt ISO cao (High ISO Noise):** Trong bóng tối, thuật toán khử nhiễu (Denoise) của phần cứng làm bệt các chi tiết ngón tay.
6. **Lỗi tràn bộ đệm YUV:** Camera API thỉnh thoảng sinh ra các khung hình `yuv` bị hỏng (Corrupt Frame) với dải màu xanh lá cây hoặc tím bao phủ.
7. **Nhiệt độ cảm biến:** Quay/quét camera liên tục làm cảm biến nóng lên tới 45°C, HĐH Android sẽ tự động hạ FPS của camera từ 30 xuống 15 hoặc thậm chí 10 FPS.
8. **Xung đột Đèn Flash:** Bật Flash liên tục trong Auto Mode sẽ gây chói sáng cục bộ (Over-exposure) ngay lòng bàn tay.
9. **Sai số Tiêu cự (Focal Length):** Camera siêu rộng (Ultra-wide) có hiện tượng méo thùng (Barrel Distortion) ở viền, khiến thuật toán Crop tay ở rìa ảnh bị biến dạng.
10. **Lỗi không khởi tạo được Frame Processor:** Một số dòng máy Xiaomi/Oppo cấu hình Android tùy biến chặt đứt quyền truy cập C++ của Vision Camera.

---

## II. Nút thắt cổ chai JSI & Hermes Engine
11. **Rác bộ nhớ JSI Bridge:** Trái với suy nghĩ thông thường, việc truyền quá nhiều chuỗi log `console.log` từ Worklet C++ sang JS Thread gây nghẽn JSI Bridge.
12. **Hermes GC Pause:** Thu gom rác của Hermes Engine thỉnh thoảng sẽ khựng lại (Stop-the-world) khoảng 20ms - 50ms, làm đứt nhịp đếm 1 giây của Auto Mode.
13. **Nghẽn hàng đợi Microtask:** Lệnh `runOnJS` ném các tác vụ vào Microtask Queue. Nếu ứng dụng đang parse một file JSON nặng (như Load từ điển), `triggerAutoScan` sẽ bị kẹt lại.
14. **Tràn bộ nhớ đệm Reanimated:** Shared Values cập nhật quá nhanh (30 lần/giây) có nguy cơ gây phân mảnh bộ nhớ Native nếu không có cơ chế Garbage Collection tối ưu từ thư viện.
15. **Lỗi đồng bộ biến State:** Khi `isLiveScanning` thay đổi trạng thái, có một độ trễ 1-2 frame trước khi Worklet nhận biết được, gây ra các phép tính thừa thãi.
16. **Nút thắt `JSON.parse` lịch sử:** Việc lưu và đọc mảng `sessionHistory` vào AsyncStorage bằng JSON gây chặn luồng JS khi lịch sử đạt hàng ngàn mục.
17. **Rò rỉ Event Listener:** Nếu App bị force close ngầm, các Hook của Vision Camera không dọn dẹp sạch `CameraSession` ở mức Native.
18. **Chậm trễ Layout Animation:** Thư viện UI thỉnh thoảng render chậm hơn 1 frame so với tốc độ tính toán của handBox, khiến khung xanh hơi trượt.
19. **Lỗi Promise lồng nhau:** Các hàm `await` trong `handleManualScan` không thể hủy (cancel) nếu người dùng đột ngột đổi chế độ.
20. **Tắc nghẽn Native Module:** `ImageManipulator` phải vận chuyển ảnh từ Native (Java) sang JS, rồi lại từ JS đẩy vào TFLite (C++), quy trình này quá cồng kềnh.

---

## III. Giới hạn AI (TensorFlow Lite & Neural Engine)
21. **GPU Delegation Fail:** Nếu máy người dùng dùng GPU Mali cũ không hỗ trợ OpenGL ES 3.1, mô hình AI tự fallback về CPU, làm tiêu thụ pin tăng x5 lần.
22. **NPU Conflict:** CoreML (iOS) hoặc NNAPI (Android) thỉnh thoảng cache sai trọng số mô hình khi có 2 mô hình (Hand Detection và Sign Language) chạy song song.
23. **Sai lệch Quantization:** TFLite Float32 bị chuyển đổi ngầm sang Float16 trên phần cứng Neural Engine (Apple), làm giảm nhẹ độ chính xác logit.
24. **Warm-up Penalty:** Mặc dù đã có cơ chế Warm-up, nhưng nếu app bị HĐH đóng băng, lệnh inference đầu tiên sau khi mở lại vẫn mất 300ms+.
25. **Tensor Shape Mismatch:** Nếu phiên bản TFLite C++ library không đồng nhất với file model, HĐH có thể crash ngầm tiến trình (SIGSEGV).
26. **Kẹt luồng Threadpool:** TFLite sử dụng XNNPACK với 4 luồng (threads). Nếu Hệ điều hành bận xử lý tác vụ khác, việc tranh giành tài nguyên CPU gây lag giật.
27. **Bias Phông nền:** Mô hình Palm Detection thỉnh thoảng nhận diện nhầm "mặt người", "quả cam", hoặc "bức tường màu da" thành bàn tay.
28. **Bàn tay ngược (Inverted Hand):** Trí tuệ nhân tạo TFLite bị bối rối nếu người dùng lộn ngược điện thoại hoặc lộn ngược tay.
29. **Lỗi Multiple Models:** Tràn RAM Native khi Load cùng lúc mô hình nặng >50MB và Frame Processor >10MB trên máy có 2GB RAM.
30. **Precision Float:** Biến thiên kết quả (Non-deterministic) giữa điện thoại chip Snapdragon và MediaTek do kiến trúc dấu phẩy động khác nhau.

---

## IV. Rủi ro OS & Vòng đời Ứng dụng (Lifecycle & OS)
31. **Lỗi Mất cắp Camera (Camera Hijacking):** Đang dùng Auto Mode thì có cuộc gọi Zalo tới. Zalo cướp quyền Camera khiến App bị văng hoặc đen màn hình vĩnh viễn.
32. **App Standby Bucket:** Android có thể đưa App vào chế độ nghỉ (Doze mode) làm giảm xung nhịp CPU, khiến TFLite chạy chậm như rùa.
33. **Memory Pressure:** iOS thỉnh thoảng gửi cảnh báo `didReceiveMemoryWarning`. Nếu không dọn dẹp kịp mảng ảnh, iOS sẽ "giết" app (OOM Kill).
34. **Background Execution Limit:** Cố gắng chụp ảnh bằng `takeSnapshot` khi app vừa bị đẩy xuống Background sẽ văng Exception.
35. **Storage Scoped Access:** Lỗi quyền truy cập file rác trên Android 11+ (Scoped Storage) ngăn ứng dụng xóa các file tạm do `ImageManipulator` sinh ra ở ngoài vùng đệm.
36. **Bật chế độ tiết kiệm pin (Low Power Mode):** HĐH bóp băng thông GPU, khiến Frame Processor chỉ còn chạy ở 10 FPS.
37. **Orientation Bug:** Người dùng xoay ngang màn hình (Landscape), tọa độ ảnh bị xoay 90 độ, mô hình nhận diện tay bị mù lòa.
38. **Thermal Throttling Alert:** iOS hiện cảnh báo nhiệt độ làm giảm độ sáng màn hình, lúc này API Camera tự động tối lại.
39. **Quyền Camera bị rút ngầm:** Người dùng vào Setting rút quyền Camera trong lúc App đang chạy ngầm, khi mở lại App sẽ crash nếu không bẫy lỗi ở `AppState`.
40. **Nén bộ nhớ ảo (ZRAM):** Android nén vùng nhớ của TFLite, khi cần dùng tới phải giải nén (Page Fault) mất 100ms.

---

## V. UX Cực Đoan & Edge Cases (Extreme Scenarios)
41. **Spam Mode:** Người dùng dùng nhiều ngón tay chạm liên tục vào nút đổi Mode (Live -> Auto -> Batch -> Live) 10 lần/giây, ép State Machine và luồng Render nổ tung.
42. **Tay quá sát màn hình:** Bàn tay chiếm 99% màn hình, thuật toán nhân hệ số `scale 3x` tạo ra một khung vuông khổng lồ bao trùm cả vũ trụ, làm ImageManipulator kiệt sức vì cắt ảnh độ phân giải lớn.
43. **Tay di chuyển bằng tốc độ ánh sáng:** Vận tốc vung tay nhanh hơn thời gian trễ của Camera Shutter Speed (1/60s), ảnh Snapshot bị nhòe (Motion Blur) 100%, Auto Mode chụp thành công nhưng mô hình Sign Language đọc ra toàn chữ rác.
44. **Bàn tay ma (Phantom Hand):** Chế độ làm mượt EMA bị lưu viền. Nếu che camera lại lập tức, khung xanh vẫn tiếp tục trôi lờ đờ về hướng di chuyển trước đó thêm 200ms.
45. **Nhận diện kính hiển vi:** Tay ở khoảng cách quá xa (2 mét), Box tay nhỏ xíu 10x10 pixel. Crop ra phóng to lên vỡ hạt (Pixelated), mô hình đọc sai hoàn toàn.
46. **Giọng đọc đè lấp vĩnh cửu:** Text-To-Speech (TTS) đọc những đoạn văn dài. Auto Mode quét liên tục ra chữ mới và đẩy vào luồng đọc, khiến điện thoại nói nhảm không bao giờ dừng.
47. **Chớp nhoáng Flash:** Trong điều kiện tối, màn hình tự động bật Flash khi Auto Mode chuẩn bị chụp (State 2), làm người dùng chói mắt lặp đi lặp lại mỗi 1.5s.
48. **UI đè nút thao tác:** Nếu người dùng có bàn tay quá to, Khung xanh lá sẽ giãn nở bự ra và đè lên (Block) các nút bấm UI khác trên màn hình (vì z-index của khung xanh cao).
49. **Chết đuối trong thông báo:** Lỗi `setSnackbarMsg` chưa có hàng đợi. Nếu hiện 10 thông báo liên tục, Snackbar sẽ nháy loạn xạ.
50. **Phụ thuộc quá mức:** Ứng dụng quá hoàn hảo khiến người dùng quên mất cách sử dụng các chế độ khác (Live, Video). 😂
