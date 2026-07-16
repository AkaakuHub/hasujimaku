import { describe, expect, it } from "vitest";

import { createImageRenderer, type ImageRenderWorker } from "./imageRenderer";

class FakeImageRenderWorker implements ImageRenderWorker {
  private listener: ((event: MessageEvent<unknown>) => void) | undefined;

  addEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void): void {
    this.listener = listener;
  }

  postMessage(message: unknown): void {
    const request = message as { requestId: number };
    this.listener?.({
      data: { requestId: request.requestId, type: "success", png: new ArrayBuffer(3) },
    } as MessageEvent<unknown>);
  }
}

class FailingImageRenderWorker implements ImageRenderWorker {
  private listener: ((event: MessageEvent<unknown>) => void) | undefined;

  addEventListener(_type: "message", listener: (event: MessageEvent<unknown>) => void): void {
    this.listener = listener;
  }

  postMessage(message: unknown): void {
    const request = message as { requestId: number };
    this.listener?.({
      data: { message: "生成できません", requestId: request.requestId, type: "failure" },
    } as MessageEvent<unknown>);
  }
}

describe("createImageRenderer", () => {
  it("WorkerのPNG応答をBlobに変換する", async () => {
    const renderImage = createImageRenderer(new FakeImageRenderWorker());

    const blob = await renderImage({
      baseImageBase64: "data:image/png;base64,",
      name: "名前",
      quote: "字幕",
    });

    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(3);
  });

  it("Workerのエラーを呼び出し元へ返す", async () => {
    const renderImage = createImageRenderer(new FailingImageRenderWorker());

    await expect(
      renderImage({ baseImageBase64: "data:image/png;base64,", name: "名前", quote: "字幕" }),
    ).rejects.toThrow("生成できません");
  });
});
