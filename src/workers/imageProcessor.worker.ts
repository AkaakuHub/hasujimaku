/// <reference lib="webworker" />

import type { ImageProcessorRequest, ImageProcessorResponse } from "../lib/imageProcessorMessages";
import { detectUnsupportedImageProcessorFeatures } from "../lib/browserCompatibility";
import { initializeImageRenderer, renderImage } from "./renderImage";
import { verifyWatermark } from "./verifyWatermark";

const postFailure = (requestId: number, error: unknown, fallbackMessage: string): void => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  self.postMessage({ message, requestId, type: "failure" } satisfies ImageProcessorResponse);
};

self.addEventListener("message", (event: MessageEvent<ImageProcessorRequest>) => {
  const request = event.data;

  if (request.type === "checkCompatibility") {
    self.postMessage({
      requestId: request.requestId,
      type: "compatibility",
      unsupportedFeatures: detectUnsupportedImageProcessorFeatures(),
    } satisfies ImageProcessorResponse);
    return;
  }

  if (request.type === "initializeRenderer") {
    void initializeImageRenderer().catch(() => undefined);
    return;
  }

  if (request.type === "verify") {
    void verifyWatermark(request.image)
      .then((detection) => {
        self.postMessage({
          detection,
          requestId: request.requestId,
          type: "verificationSuccess",
        } satisfies ImageProcessorResponse);
      })
      .catch((error: unknown) => {
        postFailure(request.requestId, error, "画像を検証できませんでした。");
      });
    return;
  }

  void renderImage(request.input)
    .then((png) => {
      self.postMessage(
        {
          png,
          requestId: request.requestId,
          type: "renderSuccess",
        } satisfies ImageProcessorResponse,
        [png],
      );
    })
    .catch((error: unknown) => {
      postFailure(request.requestId, error, "画像を生成できませんでした。");
    });
});
