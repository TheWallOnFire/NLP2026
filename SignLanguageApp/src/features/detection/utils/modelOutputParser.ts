export function parseInferenceOutput(outputs: any[], dataType: string | undefined): { maxIdx: number, maxVal: number } | null {
  if (!outputs || outputs.length === 0) return null;

  console.log(`[ML Debug] TFLite Raw Output Type:`, Object.prototype.toString.call(outputs[0]));
  console.log(`[ML Debug] TFLite Raw Output Length:`, outputs[0]?.length);
  if (outputs[0]?.length > 0) {
    console.log(`[ML Debug] TFLite Raw Output [0..3]:`, outputs[0][0], outputs[0][1], outputs[0][2]);
  }

  let outputArray: number[] | Float32Array | Uint8Array;
  
  if (dataType === 'float32' && outputs[0].buffer) {
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
  for (let i = 1; i < outputArray.length; i++) {
    if (outputArray[i] > maxVal) {
      maxVal = outputArray[i];
      maxIdx = i;
    }
  }

  const safeMaxVal = typeof maxVal === 'number' ? maxVal : 0;
  return { maxIdx, maxVal: safeMaxVal };
}
