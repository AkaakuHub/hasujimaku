import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import { renderImage } from "./imageRenderer";

interface ImageCanvasProps {
  baseImageBase64: string;
  canRender: boolean;
  quote: string;
  name: string;
  setRenderingError: Dispatch<SetStateAction<string | null>>;
  setResultImageUrl: Dispatch<SetStateAction<string>>;
  setIsFetching: Dispatch<SetStateAction<boolean>>;
}

const renderingDelay = 150;

const ImageCanvas = ({
  baseImageBase64,
  canRender,
  quote,
  name,
  setRenderingError,
  setResultImageUrl,
  setIsFetching,
}: ImageCanvasProps) => {
  const resultImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultImageUrlRef.current) {
        URL.revokeObjectURL(resultImageUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (baseImageBase64 === "" || !canRender) {
      setIsFetching(false);
      setRenderingError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      const render = async () => {
        setIsFetching(true);
        setRenderingError(null);

        try {
          const blob = await renderImage({ baseImageBase64, quote, name });
          if (cancelled) {
            return;
          }

          const resultImageUrl = URL.createObjectURL(blob);
          if (resultImageUrlRef.current) {
            URL.revokeObjectURL(resultImageUrlRef.current);
          }
          resultImageUrlRef.current = resultImageUrl;
          setResultImageUrl(resultImageUrl);
        } catch (error) {
          if (!cancelled) {
            setRenderingError(
              error instanceof Error ? error.message : "画像を生成できませんでした。",
            );
          }
        } finally {
          if (!cancelled) {
            setIsFetching(false);
          }
        }
      };

      void render();
    }, renderingDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    baseImageBase64,
    canRender,
    name,
    quote,
    setIsFetching,
    setRenderingError,
    setResultImageUrl,
  ]);

  return null;
};

export default ImageCanvas;
