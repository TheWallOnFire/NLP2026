import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';

const resources = {
  en: {
    translation: {
      settings: {
        title: "Settings",
        theme: "Theme",
        current: "Current",
        light: "Light",
        dark: "Dark",
        mixed: "Mixed",
        language: "Language",
        english: "English",
        vietnamese: "Tiếng Việt",
        soundAndVoice: "Sound & Voice",
        systemSounds: "System Sounds",
        learningFeedback: "Learning Feedback",
        captureNotification: "Capture Notification",
        cameraAndDetection: "Camera & Detection",
        frontCamera: "Front Camera",
        backCamera: "Back Camera",
        detectionSpeed: "Detection Speed",
        hapticFeedback: "Haptic Feedback",
        storageAndData: "Storage & Data",
        localLogging: "Local Logging",
        exportData: "Export Data (CSV)",
        deleteAllData: "Delete All Data",
        permissions: "Permissions",
        cameraAccess: "Camera Access",
        microphoneAccess: "Microphone Access",
        storageAccess: "Storage Access",
        cacheManagement: "Cache Management",
        mediaCacheSize: "Media Cache Size",
        clearMediaCache: "Clear Media Cache",
        modelPack: "Model Pack",
        viewLibrary: "View Library",
        importCustomPack: "Import Custom Pack",
        systemAndAlerts: "System & Alerts",
        dailyReminders: "Daily Reminders",
        batterySaverMode: "Battery Saver Mode",
        developerDebugMode: "Developer Debug Mode",
        dangerZone: "Danger Zone",
        resetAllFactorySettings: "Reset All Factory Settings",
        granted: "Granted",
        denied: "Denied",
        appCanSave: "App can save media to cache",
        mediaSavingDisabled: "Media saving disabled",
        calculating: "Calculating...",
        clearing: "Clearing...",
        importing: "Importing..."
      }
    }
  },
  vi: {
    translation: {
      settings: {
        title: "Cài đặt",
        theme: "Giao diện",
        current: "Hiện tại",
        light: "Sáng",
        dark: "Tối",
        mixed: "Hỗn hợp",
        language: "Ngôn ngữ",
        english: "English",
        vietnamese: "Tiếng Việt",
        soundAndVoice: "Âm thanh & Giọng nói",
        systemSounds: "Âm thanh hệ thống",
        learningFeedback: "Phản hồi học tập",
        captureNotification: "Âm chụp ảnh",
        cameraAndDetection: "Camera & Nhận diện",
        frontCamera: "Camera trước",
        backCamera: "Camera sau",
        detectionSpeed: "Tốc độ nhận diện",
        hapticFeedback: "Phản hồi rung",
        storageAndData: "Lưu trữ & Dữ liệu",
        localLogging: "Ghi log cục bộ",
        exportData: "Xuất dữ liệu (CSV)",
        deleteAllData: "Xóa toàn bộ dữ liệu",
        permissions: "Quyền truy cập",
        cameraAccess: "Quyền Camera",
        microphoneAccess: "Quyền Micro",
        storageAccess: "Quyền Bộ nhớ",
        cacheManagement: "Quản lý Bộ nhớ đệm (Cache)",
        mediaCacheSize: "Dung lượng Cache",
        clearMediaCache: "Xóa Cache",
        modelPack: "Gói Mô hình",
        viewLibrary: "Xem thư viện",
        importCustomPack: "Nhập gói tuỳ chỉnh",
        systemAndAlerts: "Hệ thống & Cảnh báo",
        dailyReminders: "Nhắc nhở hằng ngày",
        batterySaverMode: "Chế độ Tiết kiệm pin",
        developerDebugMode: "Chế độ Gỡ lỗi",
        dangerZone: "Khu vực Nguy hiểm",
        resetAllFactorySettings: "Khôi phục cài đặt gốc",
        granted: "Đã cấp quyền",
        denied: "Đã từ chối",
        appCanSave: "Ứng dụng có thể lưu trữ",
        mediaSavingDisabled: "Lưu trữ bị tắt",
        calculating: "Đang tính toán...",
        clearing: "Đang xóa...",
        importing: "Đang nhập..."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: useSettingsStore.getState().language || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

// Sync language changes from Zustand store
useSettingsStore.subscribe((state, prevState) => {
  if (state.language !== prevState?.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;
