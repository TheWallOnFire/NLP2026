import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { ModelPack } from '../features/learning/store/useModelStore';
import { Word } from '../features/learning/store/useLearningStore';

export const importCustomPack = async (): Promise<{ pack: ModelPack, words: Word[] } | null> => {
  try {
    // 1. Pick the file
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const fileUri = file.uri;

    // Bước 1.1: Xác thực định dạng file (chỉ chấp nhận .zip)
    const isZip = file.name.toLowerCase().endsWith('.zip') || (file.mimeType && file.mimeType.includes('zip'));
    if (!isZip) {
      throw new Error("Định dạng tệp không hợp lệ. Vui lòng chọn tệp .zip chứa mô hình.");
    }

    // Bước 1.2: Xác thực kích thước file để tránh OOM (Ví dụ tối đa 150MB)
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("Không thể tìm thấy tệp đã chọn.");
    }
    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
    if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
      throw new Error("Kích thước tệp quá lớn (>150MB), có thể gây tràn bộ nhớ. Vui lòng chọn tệp nhỏ hơn.");
    }

    // 2. Read the zip file via fetch to ArrayBuffer to prevent Base64 string OOM
    let loadedZip;
    try {
      const response = await fetch(fileUri);
      const arrayBuffer = await response.arrayBuffer();
      
      // 3. Load with JSZip
      const zip = new JSZip();
      loadedZip = await zip.loadAsync(arrayBuffer);
    } catch (e) {
      throw new Error("Tệp không đúng định dạng nén chuẩn hoặc bị hỏng. Không thể đọc dữ liệu.");
    }

    // 4. Find metadata.json and word_list.json
    let metadataFile = null;
    let wordListFile = null;
    let tfliteFile = null;

    loadedZip.forEach((relativePath, zipEntry) => {
      if (relativePath.endsWith('metadata.json')) metadataFile = zipEntry;
      if (relativePath.endsWith('word_list.json')) wordListFile = zipEntry;
      if (relativePath.endsWith('.tflite')) tfliteFile = zipEntry;
    });

    if (!metadataFile || !wordListFile || !tfliteFile) {
      throw new Error("Gói mô hình không hợp lệ: Thiếu các tệp cốt lõi (metadata.json, word_list.json, hoặc model.tflite).");
    }

    // 5. Parse and Validate JSONs
    let metadataRaw;
    let wordListRaw;

    try {
      const metadataStr = await (metadataFile as any).async("text");
      metadataRaw = JSON.parse(metadataStr);
    } catch (e) {
      throw new Error("Lỗi tương thích: Tệp metadata.json bị hỏng hoặc sai định dạng.");
    }

    try {
      const wordListStr = await (wordListFile as any).async("text");
      wordListRaw = JSON.parse(wordListStr);
    } catch (e) {
      throw new Error("Lỗi tương thích: Tệp word_list.json bị hỏng hoặc sai định dạng.");
    }

    // 5.1 Kiểm tra tính tương thích của dữ liệu
    if (!metadataRaw.id || !metadataRaw.name) {
      throw new Error("Gói mô hình không đạt chuẩn: Thiếu trường 'id' hoặc 'name' trong metadata.");
    }

    if (typeof wordListRaw !== 'object' || Object.keys(wordListRaw).length === 0) {
      throw new Error("Dữ liệu trống: Không tìm thấy từ vựng nào trong word_list.json.");
    }

    // 6. Save .tflite to persistent storage
    const packId = metadataRaw.id || `custom-${Date.now()}`;
    const packDir = `${FileSystem.documentDirectory}packs/${packId}/`;
    
    // Ensure dir exists
    const dirInfo = await FileSystem.getInfoAsync(packDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(packDir, { intermediates: true });
    }

    const tfliteDestUri = `${packDir}model.tflite`;
    const tfliteBase64 = await (tfliteFile as any).async("base64");
    await FileSystem.writeAsStringAsync(tfliteDestUri, tfliteBase64, {
      encoding: 'base64',
    });

    // Extract word images if any
    const imagesDir = `${packDir}word_images/`;
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true }).catch(() => {});
    
    // Iterate over files again to extract images
    const extractPromises: Promise<void>[] = [];
    loadedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && relativePath.includes('word_images/')) {
        const fileName = relativePath.split('/').pop();
        if (fileName) {
          const promise = zipEntry.async("base64").then(b64 => {
            return FileSystem.writeAsStringAsync(`${imagesDir}${fileName}`, b64, {
              encoding: 'base64',
            });
          });
          extractPromises.push(promise);
        }
      }
    });
    await Promise.all(extractPromises);

    // 7. Construct Store Objects
    const wordCount = Object.keys(wordListRaw).length;
    
    const pack: ModelPack = {
      id: packId,
      name: metadataRaw.name || "Custom Pack",
      description: metadataRaw.description || "A custom imported model pack.",
      version: metadataRaw.version || "1.0.0",
      wordCount,
      isDownloaded: true,
      category: 'Basics', // default for custom
      inputShape: metadataRaw.input_shape || undefined,
    };

    const words: Word[] = Object.keys(wordListRaw).map(key => ({
      id: key,
      word: wordListRaw[key],
      learned: false,
      favorite: false,
    }));

    return { pack, words };

  } catch (error: any) {
    console.error("Pack Import Error:", error);
    // Nếu là lỗi do JSZip ném ra khi file zip hỏng
    if (error.message && error.message.includes("End of data reached")) {
      throw new Error("File .zip bị hỏng hoặc chưa tải xong hoàn toàn.");
    }
    // Trả về lỗi có sẵn hoặc lỗi chung
    throw new Error(error.message || "Đã xảy ra lỗi không xác định khi giải nén gói mô hình.");
  }
};
