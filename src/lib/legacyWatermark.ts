interface LegacyWatermarkLayout {
  baseBottom: number;
  baseFontSize: number;
  baseLeft: number;
  baseWidth: number;
}

const legacyWatermarkLayouts: LegacyWatermarkLayout[] = [
  { baseBottom: 30, baseFontSize: 20, baseLeft: 36, baseWidth: 604 },
  { baseBottom: 5, baseFontSize: 16, baseLeft: 5, baseWidth: 222 },
];

const getTextScale = (width: number, height: number): number =>
  height > width ? width / 1080 : Math.min(width / 1920, height / 1080);

const getLuminance = (pixels: Uint8ClampedArray, width: number, x: number, y: number): number => {
  const pixelIndex = (y * width + x) * 4;
  return (
    pixels[pixelIndex] * 0.2126 + pixels[pixelIndex + 1] * 0.7152 + pixels[pixelIndex + 2] * 0.0722
  );
};

interface Region {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface EdgeMetrics {
  activeCellRate: number;
  density: number;
}

const getEdgeMetrics = (
  pixels: Uint8ClampedArray,
  width: number,
  region: Region,
  cellWidth: number,
): EdgeMetrics => {
  const regionWidth = region.right - region.left;
  const regionHeight = region.bottom - region.top;
  const cellCount = Math.max(1, Math.floor(regionWidth / cellWidth));
  const edgeCounts = new Uint32Array(cellCount);
  let edgeCount = 0;

  for (let y = region.top + 1; y < region.bottom - 1; y += 1) {
    for (let x = region.left + 1; x < region.right - 1; x += 1) {
      const horizontalContrast = Math.abs(
        getLuminance(pixels, width, x + 1, y) - getLuminance(pixels, width, x - 1, y),
      );
      const verticalContrast = Math.abs(
        getLuminance(pixels, width, x, y + 1) - getLuminance(pixels, width, x, y - 1),
      );
      if (Math.max(horizontalContrast, verticalContrast) < 24) {
        continue;
      }

      edgeCount += 1;
      const cellIndex = Math.min(
        cellCount - 1,
        Math.floor(((x - region.left) * cellCount) / regionWidth),
      );
      edgeCounts[cellIndex] += 1;
    }
  }

  const measuredHeight = Math.max(1, regionHeight - 2);
  const measuredCellWidth = Math.max(1, (regionWidth - 2) / cellCount);
  const activeCellThreshold = measuredHeight * measuredCellWidth * 0.06;
  const activeCells = edgeCounts.reduce(
    (count, currentEdgeCount) => count + Number(currentEdgeCount >= activeCellThreshold),
    0,
  );
  const measuredArea = Math.max(1, (regionWidth - 2) * measuredHeight);

  return {
    activeCellRate: activeCells / cellCount,
    density: edgeCount / measuredArea,
  };
};

const hasWatermarkGeometry = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  layout: LegacyWatermarkLayout,
): boolean => {
  const scale = getTextScale(width, height);
  const fontSize = layout.baseFontSize * scale;
  if (fontSize < 4) {
    return false;
  }

  const baseline = height - layout.baseBottom * scale;
  const left = Math.max(0, Math.floor((layout.baseLeft - 3) * scale));
  const right = Math.min(width, Math.ceil((layout.baseLeft + layout.baseWidth + 3) * scale));
  const top = Math.max(0, Math.floor(baseline - fontSize * 1.1));
  const bottom = Math.min(height, Math.ceil(baseline + fontSize * 0.25));
  if (right - left < 3 || bottom - top < 3) {
    return false;
  }

  const watermarkRegion = { bottom, left, right, top };
  const regionHeight = bottom - top;
  const comparisonBottom = Math.max(regionHeight, top - Math.ceil(fontSize * 0.4));
  const comparisonTop = comparisonBottom - regionHeight;
  const watermarkMetrics = getEdgeMetrics(pixels, width, watermarkRegion, fontSize);
  const comparisonMetrics = getEdgeMetrics(
    pixels,
    width,
    { bottom: comparisonBottom, left, right, top: comparisonTop },
    fontSize,
  );

  return (
    watermarkMetrics.activeCellRate >= 0.65 &&
    watermarkMetrics.density >= 0.08 &&
    watermarkMetrics.density >= comparisonMetrics.density * 1.35 + 0.015
  );
};

export const detectLegacyWatermark = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): boolean => {
  if (width <= 0 || height <= 0 || pixels.length !== width * height * 4) {
    return false;
  }

  return legacyWatermarkLayouts.some((layout) =>
    hasWatermarkGeometry(pixels, width, height, layout),
  );
};
