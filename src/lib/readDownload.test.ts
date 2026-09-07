import { describe, expect, it, vi } from "vitest";

import { readDownload } from "./readDownload";

describe("readDownload", () => {
  it("受信したバイト数をダウンロード率として通知する", async () => {
    const onProgress = vi.fn();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(Uint8Array.from([1, 2]));
          controller.enqueue(Uint8Array.from([3, 4]));
          controller.close();
        },
      }),
      { headers: { "content-length": "4" } },
    );

    expect(new Uint8Array(await readDownload(response, onProgress))).toEqual(
      Uint8Array.from([1, 2, 3, 4]),
    );
    expect(onProgress.mock.calls).toEqual([[0], [50], [100]]);
  });

  it("ファイルサイズを取得できない場合は進捗を通知せず読み込む", async () => {
    const onProgress = vi.fn();
    const response = new Response(Uint8Array.from([1, 2, 3]));

    expect(new Uint8Array(await readDownload(response, onProgress))).toEqual(
      Uint8Array.from([1, 2, 3]),
    );
    expect(onProgress).not.toHaveBeenCalled();
  });
});
