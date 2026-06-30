import * as ImageManipulator from 'expo-image-manipulator';
import { loadImage } from 'react-native-nitro-image';

// Lưu trữ Mẫu động (Adaptive Hue)
let targetHue = -1; 

export function resetCamShiftTracker() {
  targetHue = -1;
}

/**
 * Chuyển đổi RGB sang HSV
 */
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

/**
 * Thuật toán CamShift / MeanShift (Phiên bản chuẩn HSV + Adaptive Histogram)
 */
export async function trackWithCamShift(
  snapshotUri: string,
  prevBox: { x: number; y: number; w: number; h: number },
  imgW: number,
  imgH: number
) {
  try {
    const searchW = Math.min(imgW, prevBox.w * 1.5);
    const searchH = Math.min(imgH, prevBox.h * 1.5);
    let searchX = Math.floor(Math.max(0, prevBox.x - (searchW - prevBox.w) / 2));
    let searchY = Math.floor(Math.max(0, prevBox.y - (searchH - prevBox.h) / 2));

    // Đảm bảo không vượt quá viền phải và dưới của ảnh (gây crash ImageManipulator)
    let finalSearchW = Math.floor(Math.min(searchW, imgW - searchX));
    let finalSearchH = Math.floor(Math.min(searchH, imgH - searchY));

    const cropAction = {
      crop: {
        originX: searchX,
        originY: searchY,
        width: finalSearchW,
        height: finalSearchH,
      },
    };

    const manip = await ImageManipulator.manipulateAsync(
      snapshotUri,
      [cropAction, { resize: { width: 64, height: 64 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.5 }
    );

    const cleanPath = manip.uri.startsWith('file://') ? manip.uri.replace('file://', '') : manip.uri;
    const img = await loadImage({ filePath: cleanPath });
    const pixels = await img.toRawPixelData();
    const data = new Uint8Array(pixels.buffer || pixels);

    let sumX = 0, sumY = 0, mass = 0;
    let sumHue = 0;

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // 1. Chuyển đổi hệ màu sang HSV
        const [h, s, v] = rgbToHsv(r, g, b);

        // 2. LỌC NHIỄU SÁNG (Masking) nới lỏng cho nắm tay bị tối
        // Giảm giới hạn tối xuống V < 10 (chỉ loại bỏ màu đen kịt). 
        if (v < 10 || (v > 98 && s < 5) || s < 10) {
          continue; 
        }

        // 3. Phân tích Sắc độ (Hue)
        let isSkin = false;
        
        if (targetHue === -1) {
          // Lần đầu: Tìm màu da theo chuẩn chung (Mở rộng Hue 0-35 hoặc 325-360)
          if ((h >= 0 && h <= 35) || (h >= 325 && h <= 360)) {
            isSkin = true;
          }
        } else {
          // Các lần sau: Nới lỏng khoảng cách màu (diff <= 40)
          let diff = Math.abs(h - targetHue);
          if (diff > 180) diff = 360 - diff; 
          if (diff <= 40) {
            isSkin = true;
          }
        }

        if (isSkin) {
          sumX += x;
          sumY += y;
          mass++;
          // Để tính trung bình Hue an toàn, quy về dạng vector nếu sát mốc 0/360.
          // Nhưng để đơn giản (vì diff <= 30), ta cộng dồn.
          sumHue += (h >= 335) ? h - 360 : h; 
        }
      }
    }

    // 4. Điều kiện Thoát: Bàn tay nắm quá chặt bị che hoàn toàn hoặc rời khỏi màn hình
    // Nới lỏng số lượng pixel tối thiểu (Mass) từ 50 xuống 20 pixel để không bị mất dấu khi nắm quá chặt
    if (mass < 20) {
      return null;
    }

    // 5. Cập nhật MẪU ĐỘNG (Adaptive Histogram)
    const currentFrameAvgHue = sumHue / mass;
    const normalizedAvgHue = currentFrameAvgHue < 0 ? currentFrameAvgHue + 360 : currentFrameAvgHue;
    
    if (targetHue === -1) {
       targetHue = normalizedAvgHue;
    } else {
       // Pha trộn 5% màu thực tế vào Mẫu cũ
       targetHue = targetHue * 0.95 + normalizedAvgHue * 0.05;
    }

    const cx = sumX / mass;
    const cy = sumY / mass;

    const realCx = searchX + (cx / 64) * finalSearchW;
    const realCy = searchY + (cy / 64) * finalSearchH;

    const newW = prevBox.w; 
    const newH = prevBox.h;
    let newX = realCx - newW / 2;
    let newY = realCy - newH / 2;

    // 6. Điều kiện Thoát 2 (Vượt biên): Bàn tay đi ra khỏi giới hạn camera
    if (newX <= 0 || newY <= 0 || newX + newW >= imgW || newY + newH >= imgH) {
      return null;
    }

    return { x: newX, y: newY, w: newW, h: newH };
  } catch (error) {
    console.warn('[CamShift] Tracking Error:', error);
    return null;
  }
}
