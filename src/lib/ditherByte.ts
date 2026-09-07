const coordinateNoise = (x: number, y: number, channel: number): number => {
  let hash =
    Math.imul(x, 0x1f12_3bb5) ^ Math.imul(y, 0x5f35_6495) ^ Math.imul(channel + 1, 0x6c8e_9cf5);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x2c1b_3c6d);
  hash ^= hash >>> 12;
  hash = Math.imul(hash, 0x297a_2d39);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x1_0000_0000;
};

export const ditherByte = (value: number, x: number, y: number, channel: number): number => {
  const clamped = Math.max(0, Math.min(255, value));
  const lower = Math.floor(clamped);
  return lower + Number(clamped - lower > coordinateNoise(x, y, channel));
};
