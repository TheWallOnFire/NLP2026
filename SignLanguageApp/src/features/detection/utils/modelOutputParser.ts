export function parseInferenceOutput(outputs: any[], dataType: string | undefined): { maxIdx: number, maxVal: number, top3: {idx: number, val: number}[] } | null {
  if (!outputs || outputs.length === 0 || !outputs[0]) return null;

  // Comment out verbose logging for better performance during normal runs,
  // but keep it available if needed.
  // console.log(`[ML Debug] TFLite Raw Output Type:`, Object.prototype.toString.call(outputs[0]));

  let outputArray: number[] | Float32Array | Uint8Array;
  
  if (outputs[0] instanceof ArrayBuffer) {
    outputArray = dataType === 'float32' ? new Float32Array(outputs[0]) : new Uint8Array(outputs[0]);
  } else if (outputs[0]?.buffer) {
    // If it's already a Float32Array, just use it
    if (dataType === 'float32' && !(outputs[0] instanceof Float32Array)) {
      outputArray = new Float32Array(outputs[0].buffer, outputs[0].byteOffset, outputs[0].byteLength / 4);
    } else {
      outputArray = outputs[0];
    }
  } else {
    outputArray = outputs[0] as any;
  }

  if (!outputArray || outputArray.length === 0) {
    console.log(`[ML Debug] LỖI: outputArray rỗng! outputs:`, outputs);
    return null;
  }

  let maxIdx = 0;
  let maxVal = outputArray[0];
  
  const indexedValues = [];
  for (let i = 0; i < outputArray.length; i++) {
    const val = outputArray[i];
    indexedValues.push({ idx: i, val });
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }

  // Sort by value descending and take top 3
  indexedValues.sort((a, b) => b.val - a.val);
  const top3 = indexedValues
    .slice(0, 3)
    .filter(v => typeof v.val === 'number' && isFinite(v.val) && !isNaN(v.val))
    .map(v => ({
      idx: v.idx,
      val: Math.round(v.val * 1000) / 1000 // Tối ưu Float JSON (Bug 25)
    }));

  let safeMaxVal = typeof maxVal === 'number' && isFinite(maxVal) && !isNaN(maxVal) ? Math.round(maxVal * 1000) / 1000 : 0;
  
  if (safeMaxVal === 0 && top3.length > 0) {
    safeMaxVal = top3[0].val; // Đề phòng lỗi làm tròn
  }

  return { maxIdx, maxVal: safeMaxVal, top3 };
}
