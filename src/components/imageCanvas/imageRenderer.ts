interface ImageRenderInput {
  baseImageBase64: string;
  name: string;
  quote: string;
}

interface ImageRenderRequest {
  input: ImageRenderInput;
  requestId: number;
  type: "render";
}

interface ImageRendererInitializeRequest {
  type: "initialize";
}

type ImageRenderWorkerRequest = ImageRenderRequest | ImageRendererInitializeRequest;

interface ImageRenderSuccessResponse {
  png: ArrayBuffer;
  requestId: number;
  type: "success";
}

interface ImageRenderFailureResponse {
  message: string;
  requestId: number;
  type: "failure";
}

type ImageRenderResponse = ImageRenderSuccessResponse | ImageRenderFailureResponse;

interface PendingRender {
  reject: (reason: Error) => void;
  resolve: (blob: Blob) => void;
}

export interface ImageRenderWorker {
  addEventListener: (type: "message", listener: (event: MessageEvent<unknown>) => void) => void;
  postMessage: (message: ImageRenderWorkerRequest) => void;
}

type ImageRenderer = ((input: ImageRenderInput) => Promise<Blob>) & {
  preload: () => void;
};

const isImageRenderResponse = (value: unknown): value is ImageRenderResponse => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !("requestId" in value)
  ) {
    return false;
  }

  return value.type === "success" || value.type === "failure";
};

export const createImageRenderer = (worker: ImageRenderWorker): ImageRenderer => {
  let nextRequestId = 0;
  const pendingRenders = new Map<number, PendingRender>();

  worker.addEventListener("message", (event) => {
    if (!isImageRenderResponse(event.data)) {
      return;
    }

    const pendingRender = pendingRenders.get(event.data.requestId);
    if (!pendingRender) {
      return;
    }

    pendingRenders.delete(event.data.requestId);
    if (event.data.type === "failure") {
      pendingRender.reject(new Error(event.data.message));
      return;
    }

    pendingRender.resolve(new Blob([event.data.png], { type: "image/png" }));
  });

  const renderImage = (input: ImageRenderInput): Promise<Blob> => {
    const requestId = nextRequestId;
    nextRequestId += 1;

    return new Promise((resolve, reject) => {
      pendingRenders.set(requestId, { resolve, reject });
      worker.postMessage({ input, requestId, type: "render" });
    });
  };

  renderImage.preload = () => {
    worker.postMessage({ type: "initialize" });
  };

  return renderImage;
};

let imageRenderer: ImageRenderer | undefined;

const getImageRenderer = (): ImageRenderer => {
  if (!imageRenderer) {
    const worker = new Worker(new URL("./imageRenderer.worker.ts", import.meta.url), {
      type: "module",
    });
    imageRenderer = createImageRenderer(worker);
  }

  return imageRenderer;
};

export const renderImage = (input: ImageRenderInput): Promise<Blob> => getImageRenderer()(input);

export const preloadImageRenderer = (): void => {
  getImageRenderer().preload();
};
