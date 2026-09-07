import * as ort from "onnxruntime-web/wasm";

import { createCachedAsyncLoader } from "./createCachedAsyncLoader";
import {
  applyTrustMarkOutput,
  getTrustMarkDetection,
  trustMarkDecoderSize,
  trustMarkEncoderSize,
  trustMarkSignature,
  type TrustMarkDetection,
} from "./trustMark";
import { createTrustMarkImageTensor } from "./trustMarkImageTensor";

const modelBaseUrl = "https://cai-watermark.adobe.net/watermarking/trustmark-models";
const modelCacheName = "trustmark-q-models-v1";
const modelUrls = {
  decoder: `${modelBaseUrl}/decoder_Q.onnx`,
  encoder: `${modelBaseUrl}/encoder_Q.onnx`,
} as const;

type ModelType = keyof typeof modelUrls;

const fetchModel = async (modelType: ModelType): Promise<ArrayBuffer> => {
  const modelUrl = modelUrls[modelType];
  const cache = "caches" in globalThis ? await caches.open(modelCacheName) : null;
  const cachedResponse = await cache?.match(modelUrl);
  if (cachedResponse) {
    return cachedResponse.arrayBuffer();
  }

  const response = await fetch(modelUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("透かしモデルを取得できませんでした。");
  }

  if (cache) {
    void cache.put(modelUrl, response.clone()).catch(() => undefined);
  }

  return response.arrayBuffer();
};

const modelLoaders = {
  decoder: createCachedAsyncLoader(() => fetchModel("decoder")),
  encoder: createCachedAsyncLoader(() => fetchModel("encoder")),
} satisfies Record<ModelType, () => Promise<ArrayBuffer>>;

let sessionCreationQueue = Promise.resolve();

const createSession = async (modelType: ModelType): Promise<ort.InferenceSession> => {
  const modelPromise = modelLoaders[modelType]();
  const sessionPromise = sessionCreationQueue.then(async () => {
    const model = await modelPromise;
    try {
      return await ort.InferenceSession.create(model, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
    } finally {
      modelLoaders[modelType].clear();
    }
  });
  sessionCreationQueue = sessionPromise.then(
    () => undefined,
    () => undefined,
  );
  return sessionPromise;
};

const sessionLoaders = {
  decoder: createCachedAsyncLoader(() => createSession("decoder")),
  encoder: createCachedAsyncLoader(() => createSession("encoder")),
} satisfies Record<ModelType, () => Promise<ort.InferenceSession>>;

const getSession = (modelType: ModelType): Promise<ort.InferenceSession> =>
  sessionLoaders[modelType]();

const getFloatOutput = (
  outputs: ort.InferenceSession.OnnxValueMapType,
  outputName: string,
): Float32Array => {
  const output = outputs[outputName]?.data;
  if (!(output instanceof Float32Array)) {
    throw new Error("透かしモデルの出力が不正です。");
  }
  return output;
};

export const initializeTrustMarkEncoder = (): Promise<ort.InferenceSession> =>
  getSession("encoder");

export const preloadTrustMarkDecoderModel = createCachedAsyncLoader(async () => {
  await modelLoaders.decoder();
});

export const initializeTrustMarkDecoder = async (): Promise<void> => {
  await getSession("decoder");
};

export const embedTrustMark = async (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<void> => {
  const input = createTrustMarkImageTensor(pixels, width, height, trustMarkEncoderSize);
  const session = await getSession("encoder");
  const outputs = await session.run({
    "onnx::Concat_0": new ort.Tensor("float32", input, [
      1,
      3,
      trustMarkEncoderSize,
      trustMarkEncoderSize,
    ]),
    "onnx::Gemm_1": new ort.Tensor("float32", trustMarkSignature, [1, trustMarkSignature.length]),
  });
  applyTrustMarkOutput(pixels, width, height, input, getFloatOutput(outputs, "image"));
};

export const detectTrustMark = async (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<TrustMarkDetection> => {
  const input = createTrustMarkImageTensor(pixels, width, height, trustMarkDecoderSize);
  const session = await getSession("decoder");
  const outputs = await session.run({
    image: new ort.Tensor("float32", input, [1, 3, trustMarkDecoderSize, trustMarkDecoderSize]),
  });
  return getTrustMarkDetection(getFloatOutput(outputs, "output"));
};
