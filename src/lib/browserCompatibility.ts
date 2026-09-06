export interface BrowserCapabilities {
  createImageBitmap: boolean;
  offscreenCanvas: boolean;
  webAssemblySimd: boolean;
}

const wasmSimdDetectionModule = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 30, 1, 28, 0, 65, 0, 253, 15, 253,
  12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 186, 1, 26, 11,
]);

const supportsWebAssemblySimd = (): boolean => {
  if (typeof WebAssembly !== "object" || typeof WebAssembly.validate !== "function") {
    return false;
  }

  try {
    return WebAssembly.validate(wasmSimdDetectionModule);
  } catch {
    return false;
  }
};

export const getUnsupportedBrowserFeatures = ({
  createImageBitmap,
  offscreenCanvas,
  webAssemblySimd,
}: BrowserCapabilities): string[] => {
  const unsupportedFeatures: string[] = [];

  if (!webAssemblySimd) {
    unsupportedFeatures.push("WebAssembly SIMD");
  }
  if (!offscreenCanvas) {
    unsupportedFeatures.push("OffscreenCanvas");
  }
  if (!createImageBitmap) {
    unsupportedFeatures.push("createImageBitmap");
  }

  return unsupportedFeatures;
};

export const detectUnsupportedImageProcessorFeatures = (): string[] =>
  getUnsupportedBrowserFeatures({
    createImageBitmap: typeof createImageBitmap === "function",
    offscreenCanvas: typeof OffscreenCanvas === "function",
    webAssemblySimd: supportsWebAssemblySimd(),
  });
