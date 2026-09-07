import { describe, expect, it } from "vitest";

import { createImageProcessor, type ImageProcessorWorker } from "./imageProcessor";
import type { ImageProcessorRequest } from "./imageProcessorMessages";

class FakeImageProcessorWorker implements ImageProcessorWorker {
  private listener: ((event: MessageEvent<unknown>) => void) | undefined;
  messages: ImageProcessorRequest[] = [];
  onerror: ((event: ErrorEvent) => void) | null = null;

  addEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void): void {
    this.listener = listener;
  }

  postMessage(message: ImageProcessorRequest): void {
    this.messages.push(message);

    if (message.type === "initializeRenderer") {
      return;
    }

    if (message.type === "checkCompatibility") {
      this.listener?.({
        data: { requestId: message.requestId, type: "compatibility", unsupportedFeatures: [] },
      } as MessageEvent<unknown>);
      return;
    }

    if (message.type === "initializeVerifier") {
      this.listener?.({
        data: { progress: 50, requestId: message.requestId, type: "verifierProgress" },
      } as MessageEvent<unknown>);
      this.listener?.({
        data: { requestId: message.requestId, type: "verifierReady" },
      } as MessageEvent<unknown>);
      return;
    }

    if (message.type === "verify") {
      this.listener?.({
        data: {
          detection: { detected: true, matchRate: 1 },
          requestId: message.requestId,
          type: "verificationSuccess",
        },
      } as MessageEvent<unknown>);
      return;
    }

    this.listener?.({
      data: { png: new ArrayBuffer(3), requestId: message.requestId, type: "renderSuccess" },
    } as MessageEvent<unknown>);
  }
}

class FailingImageProcessorWorker implements ImageProcessorWorker {
  private listener: ((event: MessageEvent<unknown>) => void) | undefined;
  onerror: ((event: ErrorEvent) => void) | null = null;

  addEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void): void {
    this.listener = listener;
  }

  postMessage(message: ImageProcessorRequest): void {
    if (message.type === "initializeRenderer") {
      return;
    }

    this.listener?.({
      data: { message: "処理できません", requestId: message.requestId, type: "failure" },
    } as MessageEvent<unknown>);
  }
}

class CrashedImageProcessorWorker implements ImageProcessorWorker {
  onerror: ((event: ErrorEvent) => void) | null = null;

  addEventListener(_type: "message", _listener: (event: MessageEvent<unknown>) => void): void {}

  postMessage(message: ImageProcessorRequest): void {
    if (message.type !== "initializeRenderer") {
      this.onerror?.({} as ErrorEvent);
    }
  }
}

describe("createImageProcessor", () => {
  it("Workerの実行環境から互換性の確認結果を受け取る", async () => {
    const worker = new FakeImageProcessorWorker();
    const processor = createImageProcessor(worker);

    const firstCheck = processor.checkCompatibility();
    const secondCheck = processor.checkCompatibility();

    expect(firstCheck).toBe(secondCheck);
    await expect(firstCheck).resolves.toEqual([]);
    expect(worker.messages).toEqual([{ requestId: 0, type: "checkCompatibility" }]);
  });

  it("複数回呼ばれても生成用の初期化要求を一度だけ送る", () => {
    const worker = new FakeImageProcessorWorker();
    const processor = createImageProcessor(worker);

    processor.preloadRenderer();
    processor.preloadRenderer();

    expect(worker.messages).toEqual([{ type: "initializeRenderer" }]);
  });

  it("複数回呼ばれても検証用の初期化要求を一度だけ送る", async () => {
    const worker = new FakeImageProcessorWorker();
    const processor = createImageProcessor(worker);

    const firstPreload = processor.preloadVerifier();
    const secondPreload = processor.preloadVerifier();

    expect(firstPreload).toBe(secondPreload);
    await expect(firstPreload).resolves.toBeUndefined();
    expect(worker.messages).toEqual([{ requestId: 0, type: "initializeVerifier" }]);
  });

  it("検証モデルのダウンロード率を呼び出し元へ通知する", async () => {
    const processor = createImageProcessor(new FakeImageProcessorWorker());
    const progress: number[] = [];

    await processor.preloadVerifier((value) => progress.push(value));

    expect(progress).toEqual([50]);
  });

  it("生成結果をPNGのBlobに変換する", async () => {
    const processor = createImageProcessor(new FakeImageProcessorWorker());

    const blob = await processor.renderImage({
      baseImageBase64: "data:image/png;base64,",
      name: "名前",
      quote: "字幕",
    });

    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(3);
  });

  it("検証結果をWorkerから受け取る", async () => {
    const processor = createImageProcessor(new FakeImageProcessorWorker());

    await expect(processor.verifyWatermark(new Blob(["image"]))).resolves.toEqual({
      detected: true,
      matchRate: 1,
    });
  });

  it("Workerのエラーを呼び出し元へ返す", async () => {
    const processor = createImageProcessor(new FailingImageProcessorWorker());

    await expect(
      processor.renderImage({
        baseImageBase64: "data:image/png;base64,",
        name: "名前",
        quote: "字幕",
      }),
    ).rejects.toThrow("処理できません");
  });

  it("Workerが異常終了した場合は待機中の処理をエラー終了する", async () => {
    const processor = createImageProcessor(new CrashedImageProcessorWorker());

    await expect(processor.verifyWatermark(new Blob(["image"]))).rejects.toThrow(
      "画像処理機能を初期化できませんでした。",
    );
  });
});
