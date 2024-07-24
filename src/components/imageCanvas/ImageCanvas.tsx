import React, { useEffect, useRef } from 'react';

interface ImageCanvasProps {
  baseImageBase64: string;
  quote: string;
  name: string;
  setResultImageUrl: React.Dispatch<React.SetStateAction<string>>;
  setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
}

const ImageCanvas: React.FC<ImageCanvasProps> = (
  { baseImageBase64, quote, name, setResultImageUrl, setIsFetching }
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRendering = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generateImage = async () => {
      if (canvasRef.current === null) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      // 前の描画処理をキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 新しいAbortControllerを作成
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (baseImageBase64 === "") {
        return;
      }

      setIsFetching(true);
      isRendering.current = true;

      const baseImage = new Image();
      baseImage.src = baseImageBase64;
      baseImage.crossOrigin = "anonymous"; // もし必要なら、クロスオリジンを設定

      baseImage.onload = () => {
        if (abortController.signal.aborted) {
          // キャンセルされた場合は何もしない
          return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(baseImage, 0, 0, 1920, 1080);

        context.font = '52px Klee One';
        context.fillStyle = '#edecec';
        context.textAlign = 'center';

        const textX: number = canvas.width / 2;
        let nameY: number = 0;

        const renderTextShadow = (text: string, x: number, y: number) => {
          const sizes = [3, 2.5, 2, 1.5, 1, 0.5];
          sizes.forEach(size => {
            context.shadowColor = '#121311';
            [...Array(16)].forEach((_, i) => {
              const angle = i * (Math.PI / 8);
              const shadowX = (Math.cos(angle) * size).toFixed(2);
              const shadowY = (Math.sin(angle) * size).toFixed(2);
              context.shadowOffsetX = parseFloat(shadowX);
              context.shadowOffsetY = parseFloat(shadowY);
              context.fillText(text, x, y);
            });
          });
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
        };

        // const renderText = (text: string, x: number, y: number, letterSpacing = 0) => {
        //   const characters = text.split('');
        //   let currentX = x - (context.measureText(text).width / 2);
        //   characters.forEach((char, index) => {
        //     context.fillText(char, currentX, y);
        //     currentX += context.measureText(char).width + letterSpacing;
        //   });
        // };

        if (!quote.includes('\n')) { // 1行の場合
          const textY = canvas.height * 0.855;
          renderTextShadow(quote, textX, textY);
          context.fillText(quote, textX, textY);
          nameY = canvas.height * 0.932;
        } else {
          const [line1, line2] = quote.split('\n');
          const textY1 = canvas.height * 0.8;
          const textY2 = canvas.height * 0.856;
          renderTextShadow(line1, textX, textY1);
          context.fillText(line1, textX, textY1);
          renderTextShadow(line2, textX, textY2);
          context.fillText(line2, textX, textY2);
          nameY = canvas.height * 0.94;
        }

        context.font = '38px Klee One';
        renderTextShadow(`[${name}]`, textX, nameY);
        context.fillText(`[${name}]`, textX, nameY);

        // Blob変換
        canvas.toBlob((blob) => {
          if (blob && !abortController.signal.aborted) {
            const url = URL.createObjectURL(blob);
            setResultImageUrl(url);
            setIsFetching(false);
            isRendering.current = false;
          }
        });
      };

      baseImage.onerror = () => {
        if (abortController.signal.aborted) {
          return;
        }
        // エラーハンドリング
        setIsFetching(false);
      };
    };

    generateImage();
  }, [baseImageBase64, quote, name, setResultImageUrl, setIsFetching]);

  return (
    <div>
      <canvas ref={canvasRef} width="1920" height="1080" style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default ImageCanvas;
