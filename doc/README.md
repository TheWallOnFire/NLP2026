# NLP2026 Documentation Hub

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của dự án **NLP2026 Sign Language Detector**.

---

## 📚 Danh mục Tài liệu Kỹ thuật

| Tài liệu | Nội dung chính |
| :--- | :--- |
| **[Project Proposal](file:///D:/VScode/NLP2026/doc/proposal.md)** | Đặt vấn đề, mục tiêu, đối tượng người dùng, phạm vi dự án và phân tích rủi ro. |
| **[Technical Design](file:///D:/VScode/NLP2026/doc/design.md)** | Kiến trúc C4, sơ đồ luồng dữ liệu (Dual-Loop Pipeline), mô hình dữ liệu và các quyết định kiến trúc (ADR). |
| **[Tech Stack](file:///D:/VScode/NLP2026/doc/tech_stack.md)** | Chi tiết toàn bộ công nghệ, thư viện Mobile Frontend, Native C++ AI Engine và Python AI Environment. |
| **[Project README](file:///D:/VScode/NLP2026/README.md)** | Tài liệu hướng dẫn cài đặt, thiết lập môi trường, chạy thử nghiệm và cấu trúc toàn bộ dự án. |

---

## 🎯 Tổng quan Kiến trúc

```text
                                  +------------------------------+
                                  |   Thiết bị Di động (Mobile)  |
                                  +--------------+---------------+
                                                 |
                   +-----------------------------+-----------------------------+
                   |                                                           |
                   v                                                           v
+------------------------------------+                       +------------------------------------+
|        Mobile Frontend             |                       |        On-Device AI Engine         |
| - React Native 0.81 + Expo SDK 54  |                       | - Fast-TFLite C++ Engine (XNNPACK) |
| - Zustand Persistent Stores        | <-------------------> | - Nitro Modules (Zero-copy memory) |
| - React Native Paper 5 (MD3)       |                       | - MediaPipe Palm Detection SSD     |
| - Reanimated 4 (UI Thread Spring)  |                       | - CamShift Adaptive Hue Tracker    |
+------------------------------------+                       | - MobileNetV2 Sign Language Model  |
                                                             +------------------------------------+
```

---

## 🚀 Lối tắt (Quick Links)

- **Mã nguồn Mobile:** Xem thư mục [`src/`](file:///D:/VScode/NLP2026/src)
- **Mô hình & Công cụ đóng gói:** Xem thư mục [`models/`](file:///D:/VScode/NLP2026/models)
- **Kịch bản kiểm thử AI:** Xem thư mục [`tests/`](file:///D:/VScode/NLP2026/tests)
- **Cấu hình mô hình:** Xem file [`configs/models_config.json`](file:///D:/VScode/NLP2026/configs/models_config.json)
