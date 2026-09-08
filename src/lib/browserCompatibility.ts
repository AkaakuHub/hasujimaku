export interface BrowserCapabilities {
  createImageBitmap: boolean;
  offscreenCanvas: boolean;
  webAssembly: boolean;
}

export const getUnsupportedBrowserFeatures = ({
  createImageBitmap,
  offscreenCanvas,
  webAssembly,
}: BrowserCapabilities): string[] => {
  const unsupportedFeatures: string[] = [];

  if (!webAssembly) {
    unsupportedFeatures.push("WebAssembly");
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
    webAssembly: typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function",
  });
