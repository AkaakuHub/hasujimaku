import heic2any from 'heic2any';

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
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

const convertToPng = async (imageSrc: string): Promise<string> => {
  if (typeof (window) === 'undefined') return imageSrc;
  if (imageSrc.startsWith("data:image/heic") || imageSrc.startsWith("data:image/heif")) {
    const blob = await heic2any({
      blob: await fetch(imageSrc).then((r) => r.blob()),
      toType: "image/png",
    });
    if (!Array.isArray(blob)) {
      return URL.createObjectURL(blob);
    }
  }
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Unable to create 2d context");

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
};

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

export const cropImage = async (image: string, croppedAreaPixels: PixelCrop, onError: (error: Error) => void): Promise<string | undefined> => {
  try {
    if (!image.startsWith("data:image/jpeg") && !image.startsWith("data:image/png")) {
      image = await convertToPng(image);
    }
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    return croppedImage;
  } catch (err) {
    onError(err as Error); // Explicitly type 'err' as 'Error'
  }
};
