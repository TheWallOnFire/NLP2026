# Phân tích & Luồng Hoạt Động Của Auto Mode (Tự Động)

## 1. Trạng thái 0: Tìm Kiếm (Searching)
- Màn hình sử dụng Frame Processor để chạy ngầm mô hình phát hiện bàn tay (Hand Detection - `palm_detection_lite.tflite`).
- **Quy tắc trễ 0.5 giây:** Khi không tìm thấy bàn tay nào trong khung hình (hoặc tay bị mất dấu), Frame Processor sẽ tự động **nghỉ 0.5 giây** trước khi chạy nhận diện lại. Điều này giúp thiết bị tiết kiệm pin tối đa thay vì chạy liên tục 30 FPS vô ích, mà vẫn giữ được độ nhạy.
- **Đảm bảo một bàn tay:** Mô hình sẽ chỉ trích xuất Box có điểm số (Logit) cao nhất, đảm bảo khung khóa (Bounding box) chỉ bám theo một bàn tay duy nhất rõ ràng nhất.

## 2. Trạng thái 1: Khóa Mục Tiêu (Locking)
- Khi phát hiện bàn tay hợp lệ, màn hình ngay lập tức xuất hiện **khung vuông (Bounding Box)** với viền và 4 góc màu xanh lá (`Animated.View`).
- Khung vuông này tính toán tọa độ `(dx, dy, w, h)` trực tiếp từ Output Tensor (Regressors) của mô hình. Khi bàn tay di chuyển hoặc to/nhỏ dần, khung sẽ tự động di chuyển và thu phóng để luôn bọc kín toàn bộ bàn tay.
- Khi hệ thống chuyển sang trạng thái Lock, nó sẽ **bắt đầu đếm ngược 1 giây (1000ms)**. Trong 1 giây này, luồng Nhận dạng Chữ vẫn bị khóa để người dùng có thời gian cố định hình dáng bàn tay chuẩn xác nhất.

## 3. Trạng thái 2: Crop Ảnh & Theo Dõi Thay Đổi (Monitoring)
- Khi thời gian khóa tay đạt đủ 1 giây, hệ thống chụp lại khung hình (Snapshot).
- **Tối ưu Crop ảnh:** Tọa độ của khung viền xanh lá (Bounding Box) sẽ được sử dụng để tự động **cắt (Crop)** chính xác khu vực chứa bàn tay thông qua `expo-image-manipulator`. Ảnh Crop này sau đó sẽ được tự động Resize về chuẩn của mô hình phân loại (Classification Model) để tăng độ chính xác lên mức tối đa.
- **Phát hiện đổi ký tự theo thời gian thực:** Lúc này hệ thống chuyển sang trạng thái Giám sát (Monitoring). Khung xanh vẫn tiếp tục bám theo bàn tay. Nếu bạn đổi tư thế tay sang một ký hiệu khác (VD: Chữ A sang B), hệ thống sẽ **tự động phân tích lại sau mỗi 1.5 giây** (`lastClassifyTime`) chừng nào bàn tay vẫn còn nằm trong khung.
- Khác biệt lõi (So với bản cũ): Ứng dụng giờ đây **KHÔNG** dùng hàm hẹn giờ đếm lùi mù quáng. Nó CHỈ thực hiện thao tác nhận diện ký tự (cực tốn pin) khi thật sự đang có bàn tay hiện diện trên màn hình. Nếu bạn hạ tay xuống, hệ thống lập tức trở về **Trạng thái 0**.