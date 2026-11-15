# NLP2026 Documentation Hub

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của dự án **NLP2026 Sign Language Detector**.

---

## 📚 Danh mục Tài liệu Kỹ thuật

### 1. Tài liệu Kiến trúc & Dự án (Core Specifications)
| Tài liệu | Nội dung chính |
| :--- | :--- |
| **[Architecture & Pipeline Specification](file:///d:/VScode/NLP2026/doc/architecture_and_pipeline.md)** | Đặc tả kiến trúc toàn diện, luồng xử lý Dual-Loop (MediaPipe + CamShift + MobileNetV2), Native C++ Nitro integration, và chính sách zero-storage bloat. |
| **[Troubleshooting & Developer FAQ](file:///d:/VScode/NLP2026/doc/troubleshooting_and_faq.md)** | Hướng dẫn khắc phục sự cố thường gặp (Metro cache, Expo Prebuild vs Expo Go, permissions, memory leaks, Python benchmarking). |
| **[Technical Design](file:///d:/VScode/NLP2026/doc/design.md)** | Kiến trúc C4 (Context & Container), sơ đồ luồng dữ liệu, schema dữ liệu và các quyết định kiến trúc (ADR). |
| **[Tech Stack](file:///d:/VScode/NLP2026/doc/tech_stack.md)** | Chi tiết toàn bộ công nghệ, thư viện Mobile Frontend (React Native 0.81, Expo 54), Native C++ AI Engine và Python AI Environment. |
| **[Project Proposal](file:///d:/VScode/NLP2026/doc/proposal.md)** | Đặt vấn đề, mục tiêu, đối tượng người dùng, phạm vi dự án và phân tích rủi ro. |
| **[Project README](file:///d:/VScode/NLP2026/README.md)** | Hướng dẫn cài đặt, thiết lập môi trường, chạy thử nghiệm và cấu trúc toàn bộ dự án. |

### 2. Tài liệu Chi tiết Ứng dụng Di động (Mobile App Companion Docs)
| Tài liệu | Nội dung chính |
| :--- | :--- |
| **[Mobile Architecture & Stores](file:///d:/VScode/NLP2026/src/docs/architecture.md)** | Cấu trúc thư mục module hóa `src/src/features/`, điều hướng React Navigation v7 và 5 Zustand stores. |
| **[Camera Hardware & Lifecycle](file:///d:/VScode/NLP2026/src/docs/camera.md)** | Tích hợp VisionCamera v5, giới hạn 30 FPS chống quá nhiệt, quản lý AppState suspend và cơ chế dọn dẹp cache. |
| **[Machine Learning Pipeline](file:///d:/VScode/NLP2026/src/docs/ml-pipeline.md)** | Chi tiết thuật toán giải mã 2,016 SSD anchors của MediaPipe Palm, CamShift Adaptive Hue và MobileNetV2 C++ inference. |
| **[Comprehensive Feature Catalog](file:///d:/VScode/NLP2026/src/docs/features.md)** | Danh mục đầy đủ tính năng: 5 chế độ nhận diện (Auto, Live, Picture, Video, Batch), Model Pack Manager, Flashcard 3D, Test Suite. |
| **[30 Edge Cases & Risk Analysis](file:///d:/VScode/NLP2026/src/docs/bug.md)** | Phân tích 30 rủi ro phần cứng, bộ nhớ, quang học, góc khuất và phương án kiểm soát. |
| **[Resolution & Refactoring Log](file:///d:/VScode/NLP2026/src/docs/fix.md)** | Nhật ký toàn bộ các bản vá lỗi P0/P1/P2/P3, event-driven queue, unmount cleanup và căn chỉnh bộ nhớ JSI. |

### 3. Kỹ năng Trợ lý AI (Agent Skills & Runbooks)
| Kỹ năng | Thư mục | Mô tả nhiệm vụ |
| :--- | :--- | :--- |
| **asl-model-packaging** | [`.agents/skills/asl-model-packaging/`](file:///d:/VScode/NLP2026/.agents/skills/asl-model-packaging/SKILL.md) | Đóng gói mô hình Keras sang `.tflite` Model Pack `.zip` di động. |
| **asl-model-evaluation** | [`.agents/skills/asl-model-evaluation/`](file:///d:/VScode/NLP2026/.agents/skills/asl-model-evaluation/SKILL.md) | Chạy bộ kiểm thử tự động `tests/test.py` (`--all`, `--run`). |
| **mobile-app-development**| [`.agents/skills/mobile-app-development/`](file:///d:/VScode/NLP2026/.agents/skills/mobile-app-development/SKILL.md) | Phát triển, cấu hình và build React Native Expo Prebuild / EAS. |
| **hand-tracking-pipeline**| [`.agents/skills/hand-tracking-detection-pipeline/`](file:///d:/VScode/NLP2026/.agents/skills/hand-tracking-detection-pipeline/SKILL.md) | Tinh chỉnh thông số Palm SSD và thuật toán bám đuổi CamShift. |
| **model-pack-management** | [`.agents/skills/model-pack-management/`](file:///d:/VScode/NLP2026/.agents/skills/model-pack-management/SKILL.md) | Quản lý sandbox bộ nhớ `packs/{id}/` và giải nén JSZip. |
| **learning-and-gamification**| [`.agents/skills/learning-and-gamification/`](file:///d:/VScode/NLP2026/.agents/skills/learning-and-gamification/SKILL.md) | Phát triển flashcard 3D và các chế độ thi đấu Test Mode. |
| **code-review** | [`.agents/skills/code-review/`](file:///d:/VScode/NLP2026/.agents/skills/code-review/SKILL.md) | Quy trình 5 bước đánh giá mã nguồn chuyên nghiệp chuẩn Google/ISO. |

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
| - Global ErrorBoundary Protection  |                       | - MobileNetV2 Sign Language Model  |
+------------------------------------+                       +------------------------------------+
```

---

## 🚀 Lối tắt (Quick Links)

- **Mã nguồn Mobile:** Xem thư mục [`src/`](file:///d:/VScode/NLP2026/src)
- **Mô hình & Công cụ đóng gói:** Xem thư mục [`models/`](file:///d:/VScode/NLP2026/models)
- **Kịch bản kiểm thử AI:** Xem thư mục [`tests/`](file:///d:/VScode/NLP2026/tests)
- **Cấu hình mô hình:** Xem file [`configs/models_config.json`](file:///d:/VScode/NLP2026/configs/models_config.json)
