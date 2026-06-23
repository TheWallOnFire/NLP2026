export function parseInferenceOutput(outputs: any[], dataType: string | undefined): { maxIdx: number, maxVal: number, top3: {idx: number, val: number}[] } | null {
  if (!outputs || outputs.length === 0 || !outputs[0]) return null;

  // Comment out verbose logging for better performance during normal runs,
  // but keep it available if needed.
  // console.log(`[ML Debug] TFLite Raw Output Type:`, Object.prototype.toString.call(outputs[0]));

  let outputArray: number[] | Float32Array | Uint8Array;
  
  if (dataType === 'float32' && outputs[0]?.buffer) {
    outputArray = new Float32Array(outputs[0].buffer, outputs[0].byteOffset, outputs[0].byteLength / 4);
  } else {
    outputArray = outputs[0] as unknown as number[] | Uint8Array;
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
  const top3 = indexedValues.slice(0, 3).map(v => ({
    idx: v.idx,
    val: Math.round(v.val * 1000) / 1000 // Tối ưu Float JSON (Bug 25)
  }));

  const safeMaxVal = typeof maxVal === 'number' ? Math.round(maxVal * 1000) / 1000 : 0;
  return { maxIdx, maxVal: safeMaxVal, top3 };
}
