import * as ort from "onnxruntime-web/wasm";

import {
  applyTrustMarkOutput,
  createTrustMarkImageTensor,
  getTrustMarkDetection,
  trustMarkDecoderSize,
  trustMarkEncoderSize,
  trustMarkSignature,
  type TrustMarkDetection,
} from "./trustMark";

const modelBaseUrl = "https://cai-watermark.adobe.net/watermarking/trustmark-models";
const modelCacheName = "trustmark-p-models-v1";
const modelUrls = {
  decoder: `${modelBaseUrl}/decoder_P.onnx`,
  encoder: `${modelBaseUrl}/encoder_P.onnx`,
} as const;

type ModelType = keyof typeof modelUrls;

const modelPromises = new Map<ModelType, Promise<ArrayBuffer>>();
const sessionPromises = new Map<ModelType, Promise<ort.InferenceSession>>();

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
    await cache.put(modelUrl, response.clone());
  }

  return response.arrayBuffer();
};

const getModel = (modelType: ModelType): Promise<ArrayBuffer> => {
  const existingPromise = modelPromises.get(modelType);
  if (existingPromise) {
    return existingPromise;
  }

  const modelPromise = fetchModel(modelType);
  modelPromises.set(modelType, modelPromise);
  return modelPromise;
};

const getSession = (modelType: ModelType): Promise<ort.InferenceSession> => {
  const existingPromise = sessionPromises.get(modelType);
  if (existingPromise) {
    return existingPromise;
  }

  const sessionPromise = getModel(modelType).then((model) =>
    ort.InferenceSession.create(model, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    }),
  );
  sessionPromises.set(modelType, sessionPromise);
  return sessionPromise;
};

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
