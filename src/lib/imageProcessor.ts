import { createCachedAsyncLoader } from "./createCachedAsyncLoader";
import type {
  ImageProcessorRequest,
  ImageProcessorResponse,
  ImageRenderInput,
} from "./imageProcessorMessages";
import type { WatermarkDetection } from "./imageWatermark";

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
  renderImage: (input: ImageRenderInput) => Promise<Blob>;
  verifyWatermark: (image: Blob) => Promise<WatermarkDetection>;
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
    value.type === "verificationSuccess"
  );
};

export const createImageProcessor = (worker: ImageProcessorWorker): ImageProcessor => {
  let nextRequestId = 0;
  let hasRequestedRendererPreload = false;
  const pendingRequests = new Map<number, PendingRequest>();
  const pendingCompatibilityChecks = new Map<number, (unsupportedFeatures: string[]) => void>();
  const pendingRenders = new Map<number, (blob: Blob) => void>();
  const pendingVerifications = new Map<number, (detection: WatermarkDetection) => void>();

  const clearPendingRequest = (requestId: number): void => {
    pendingRequests.delete(requestId);
    pendingCompatibilityChecks.delete(requestId);
    pendingRenders.delete(requestId);
    pendingVerifications.delete(requestId);
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
    renderImage: (input) =>
      startRequest<Blob>((requestId) => ({ input, requestId, type: "render" }), pendingRenders),
    verifyWatermark: (image) =>
      startRequest<WatermarkDetection>(
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

export const verifyWatermarkImage = (image: Blob): Promise<WatermarkDetection> =>
  getImageProcessor().verifyWatermark(image);

export const preloadImageRenderer = (): void => {
  getImageProcessor().preloadRenderer();
};

export const checkImageProcessorCompatibility = async (): Promise<string[]> => {
  if (typeof Worker !== "function") {
    return ["Web Worker"];
  }

  return getImageProcessor().checkCompatibility();
};
