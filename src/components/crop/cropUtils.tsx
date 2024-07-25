type PixelCrop = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: PixelCrop): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Unable to create 2d context");

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return canvas.toDataURL("image/jpeg");
}

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const CropImage = async (image: string, croppedAreaPixels: PixelCrop, onError: (error: Error) => void): Promise<string | undefined> => {
  if (typeof window !== "undefined") {
    try {
      console.log("imageBefore", image);
      const heic2any = (await import("heic2any")).default;
      if (image.startsWith("data:image/heic") || image.startsWith("data:image/heif")) {
        const blob = await heic2any({
          blob: await fetch(image).then((r) => r.blob()),
          toType: "image/png",
        });
        // imageを、新しいblobで上書き
        if (!Array.isArray(blob)) {
          image = await blobToDataURL(blob);
          console.log("imageAfter", image);
        }
        console.log("check2");
      }
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      return croppedImage;
    } catch (err) {
      onError(err as Error);
    }
  };
};
