export type DownloadProgressListener = (progress: number) => void;

export const readDownload = async (
  response: Response,
  onProgress?: DownloadProgressListener,
): Promise<ArrayBuffer> => {
  const contentLength = Number(response.headers.get("content-length"));
  if (!response.body || !Number.isSafeInteger(contentLength) || contentLength <= 0 || !onProgress) {
    return response.arrayBuffer();
  }

  let bytes = new Uint8Array(contentLength);
  const reader = response.body.getReader();
  let receivedBytes = 0;
  let reportedProgress = -1;
  const reportProgress = (progress: number): void => {
    if (progress !== reportedProgress) {
      reportedProgress = progress;
      onProgress(progress);
    }
  };
  reportProgress(0);

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (receivedBytes + value.length > bytes.length) {
      const expandedBytes = new Uint8Array(
        Math.max(receivedBytes + value.length, bytes.length * 2),
      );
      expandedBytes.set(bytes);
      bytes = expandedBytes;
    }
    bytes.set(value, receivedBytes);
    receivedBytes += value.length;
    reportProgress(Math.min(100, Math.round((receivedBytes / contentLength) * 100)));
  }

  reportProgress(100);
  return receivedBytes === bytes.length ? bytes.buffer : bytes.slice(0, receivedBytes).buffer;
};
