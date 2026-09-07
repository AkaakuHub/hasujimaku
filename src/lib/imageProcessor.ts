import { createCachedAsyncLoader } from "./createCachedAsyncLoader";
import type {
  ImageProcessorRequest,
  ImageProcessorResponse,
  ImageRenderInput,
} from "./imageProcessorMessages";
import type { TrustMarkDetection } from "./trustMark";

interface PendingRequest {
  reject: (reason: Error) => void;
}

export interface ImageProcessorWorker {
  addEventListener: (type: "message", listener: (event: MessageEvent<unknown>) => void) => void;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: ImageProcessorRequest) => void;
}

export interface ImageProcessor {
  checkCompatibility: () => Promise<string[]>;
  preloadRenderer: () => void;
  preloadVerifier: (onProgress?: (progress: number) => void) => Promise<void>;
  renderImage: (input: ImageRenderInput) => Promise<Blob>;
  verifyWatermark: (image: Blob) => Promise<TrustMarkDetection>;
}

const isImageProcessorResponse = (value: unknown): value is ImageProcessorResponse => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !("requestId" in value)
  ) {
    return false;
  }

  return (
    value.type === "failure" ||
    value.type === "compatibility" ||
    value.type === "renderSuccess" ||
    value.type === "verificationSuccess" ||
    value.type === "verifierProgress" ||
    value.type === "verifierReady"
  );
};

export const createImageProcessor = (worker: ImageProcessorWorker): ImageProcessor => {
  let nextRequestId = 0;
  let hasRequestedRendererPreload = false;
  const pendingRequests = new Map<number, PendingRequest>();
  const pendingCompatibilityChecks = new Map<number, (unsupportedFeatures: string[]) => void>();
  const pendingRenders = new Map<number, (blob: Blob) => void>();
  const pendingVerifications = new Map<number, (detection: TrustMarkDetection) => void>();
  const pendingVerifierPreloads = new Map<number, () => void>();
  const verifierProgressListeners = new Set<(progress: number) => void>();
  let verifierProgress: number | undefined;

  const clearPendingRequest = (requestId: number): void => {
    pendingRequests.delete(requestId);
    pendingCompatibilityChecks.delete(requestId);
    pendingRenders.delete(requestId);
    pendingVerifications.delete(requestId);
    pendingVerifierPreloads.delete(requestId);
  };

  worker.onerror = () => {
    const error = new Error("画像処理機能を初期化できませんでした。");
    for (const pendingRequest of pendingRequests.values()) {
      pendingRequest.reject(error);
    }
    pendingRequests.clear();
    pendingCompatibilityChecks.clear();
    pendingRenders.clear();
    pendingVerifications.clear();
    pendingVerifierPreloads.clear();
  };

  worker.addEventListener("message", (event) => {
    if (!isImageProcessorResponse(event.data)) {
      return;
    }

    const pendingRequest = pendingRequests.get(event.data.requestId);
    if (!pendingRequest) {
      return;
    }

    if (event.data.type === "failure") {
      clearPendingRequest(event.data.requestId);
      pendingRequest.reject(new Error(event.data.message));
      return;
    }

    if (event.data.type === "compatibility") {
      const resolve = pendingCompatibilityChecks.get(event.data.requestId);
      if (resolve) {
        clearPendingRequest(event.data.requestId);
        resolve(event.data.unsupportedFeatures);
      }
      return;
    }

    if (event.data.type === "renderSuccess") {
      const resolve = pendingRenders.get(event.data.requestId);
      if (resolve) {
        clearPendingRequest(event.data.requestId);
        resolve(new Blob([event.data.png], { type: "image/png" }));
      }
      return;
    }

    if (event.data.type === "verificationSuccess") {
      const resolve = pendingVerifications.get(event.data.requestId);
      if (resolve) {
        clearPendingRequest(event.data.requestId);
        resolve(event.data.detection);
      }
      return;
    }

    if (event.data.type === "verifierProgress") {
      verifierProgress = event.data.progress;
      for (const listener of verifierProgressListeners) {
        listener(verifierProgress);
      }
      return;
    }

    const resolve = pendingVerifierPreloads.get(event.data.requestId);
    if (resolve) {
      clearPendingRequest(event.data.requestId);
      resolve();
    }
  });

  const startRequest = <Result>(
    createRequest: (requestId: number) => ImageProcessorRequest,
    pendingResults: Map<number, (result: Result) => void>,
  ): Promise<Result> => {
    const requestId = nextRequestId;
    nextRequestId += 1;

    return new Promise((resolve, reject) => {
      pendingRequests.set(requestId, { reject });
      pendingResults.set(requestId, resolve);
      worker.postMessage(createRequest(requestId));
    });
  };

  const loadVerifier = createCachedAsyncLoader(() =>
    startRequest<void>(
      (requestId) => ({ requestId, type: "initializeVerifier" }),
      pendingVerifierPreloads,
    ),
  );
  const preloadVerifier = (onProgress?: (progress: number) => void): Promise<void> => {
    const verifierLoad = loadVerifier();
    if (!onProgress) {
      return verifierLoad;
    }
    verifierProgressListeners.add(onProgress);
    if (verifierProgress !== undefined) {
      onProgress(verifierProgress);
    }
    return verifierLoad.finally(() => verifierProgressListeners.delete(onProgress));
  };
  const checkCompatibility = createCachedAsyncLoader(() =>
    startRequest<string[]>(
      (requestId) => ({ requestId, type: "checkCompatibility" }),
      pendingCompatibilityChecks,
    ),
  );

  return {
    checkCompatibility,
    preloadRenderer: () => {
      if (hasRequestedRendererPreload) {
        return;
      }

      hasRequestedRendererPreload = true;
      worker.postMessage({ type: "initializeRenderer" });
    },
    preloadVerifier,
    renderImage: (input) =>
      startRequest<Blob>((requestId) => ({ input, requestId, type: "render" }), pendingRenders),
    verifyWatermark: (image) =>
      startRequest<TrustMarkDetection>(
        (requestId) => ({ image, requestId, type: "verify" }),
        pendingVerifications,
      ),
  };
};

let imageProcessor: ImageProcessor | undefined;

const getImageProcessor = (): ImageProcessor => {
  if (!imageProcessor) {
    const worker = new Worker(new URL("../workers/imageProcessor.worker.ts", import.meta.url), {
      type: "module",
    });
    imageProcessor = createImageProcessor(worker);
  }

  return imageProcessor;
};

export const renderImage = (input: ImageRenderInput): Promise<Blob> =>
  getImageProcessor().renderImage(input);

export const verifyWatermarkImage = (image: Blob): Promise<TrustMarkDetection> =>
  getImageProcessor().verifyWatermark(image);

export const preloadImageRenderer = (): void => {
  getImageProcessor().preloadRenderer();
};

export const preloadWatermarkVerifier = (onProgress?: (progress: number) => void): Promise<void> =>
  getImageProcessor().preloadVerifier(onProgress);

export const checkImageProcessorCompatibility = async (): Promise<string[]> => {
  if (typeof Worker !== "function") {
    return ["Web Worker"];
  }

  return getImageProcessor().checkCompatibility();
};
