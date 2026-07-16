import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
import Box from "@mui/material/Box";

import { drawTextWithOutline } from "./textOutline";

interface ImageCanvasProps {
  baseImageBase64: string;
  quote: string;
  name: string;
  setResultImageUrl: Dispatch<SetStateAction<string>>;
  setIsFetching: Dispatch<SetStateAction<boolean>>;
}

const renderingDelay = 150;

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = source;
  });

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve);
  });

const drawImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  quote: string,
  name: string,
) => {
  context.clearRect(0, 0, 1920, 1080);
  context.drawImage(image, 0, 0, 1920, 1080);
  context.fillStyle = "#e6e6e6";
  context.textAlign = "center";

  const textX = 960;

  context.font = "52px Klee One";
  if (!quote.includes("\n")) {
    drawTextWithOutline(context, quote, textX, 925);
  } else {
    const [line1, line2] = quote.split("\n");
    drawTextWithOutline(context, line1, textX, 864);
    drawTextWithOutline(context, line2, textX, 925);
  }

  context.font = "38px Klee One";
  drawTextWithOutline(context, `[${name}]`, textX, 1014);
};

const ImageCanvas = ({
  baseImageBase64,
  quote,
  name,
  setResultImageUrl,
  setIsFetching,
}: ImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultImageUrlRef.current) {
        URL.revokeObjectURL(resultImageUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (baseImageBase64 === "") {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      const render = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        setIsFetching(true);

        try {
          await document.fonts.ready;
          const image = await loadImage(baseImageBase64);
          if (cancelled) {
            return;
          }

          const context = canvas.getContext("2d");
          if (!context) {
            return;
          }

          drawImage(context, image, quote, name);
          const blob = await toBlob(canvas);
          if (!blob || cancelled) {
            return;
          }

          const resultImageUrl = URL.createObjectURL(blob);
          if (resultImageUrlRef.current) {
            URL.revokeObjectURL(resultImageUrlRef.current);
          }
          resultImageUrlRef.current = resultImageUrl;
          setResultImageUrl(resultImageUrl);
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
  }, [baseImageBase64, name, quote, setIsFetching, setResultImageUrl]);

  return (
    <Box component="canvas" ref={canvasRef} width="1920" height="1080" sx={{ display: "none" }} />
  );
};

export default ImageCanvas;
