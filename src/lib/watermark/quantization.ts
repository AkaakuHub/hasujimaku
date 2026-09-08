const quantizationStep = 8;
const latticePeriod = quantizationStep * 2;

const getBlockSignature = (column: number, row: number): number => {
  let hash = Math.imul(column + 1, 0x1f12_3bb5) ^ Math.imul(row + 1, 0x5f35_6495) ^ 0x32fa_6419;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb_352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846c_a68b);
  return (hash ^ (hash >>> 16)) >>> 0;
};

const getLatticeOffset = (column: number, row: number): number => {
  const signature = getBlockSignature(column, row);
  const bit = signature & 1;
  const dither = (signature >>> 1) / 0x8000_0000;
  return (bit + dither * 2) * quantizationStep;
};

export const getWatermarkAdjustment = (
  coefficient: number,
  column: number,
  row: number,
): number => {
  const offset = getLatticeOffset(column, row);
  const target = Math.round((coefficient - offset) / latticePeriod) * latticePeriod + offset;
  return target - coefficient;
};

export const getWatermarkCorrelation = (coefficient: number, column: number, row: number): number =>
  Math.cos((Math.PI * (coefficient - getLatticeOffset(column, row))) / quantizationStep);
