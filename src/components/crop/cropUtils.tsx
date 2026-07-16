import { Area } from "react-easy-crop";

import { getCropDrawOffset, getRadianAngle } from "./cropGeometry";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImage = async (
  imageSource: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<string> => {
  const image = await createImage(imageSource);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create 2d context");
  }

  const cropX = Math.round(pixelCrop.x);
  const cropY = Math.round(pixelCrop.y);
  const cropWidth = Math.round(pixelCrop.width);
  const cropHeight = Math.round(pixelCrop.height);
  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error("Invalid crop dimensions");
  }

  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const drawOffset = getCropDrawOffset(
    { width: image.width, height: image.height },
    { x: cropX, y: cropY },
    rotation,
  );
  context.translate(drawOffset.x, drawOffset.y);
  context.rotate(getRadianAngle(rotation));
  context.drawImage(image, -image.width / 2, -image.height / 2);

  return canvas.toDataURL("image/jpeg");
};

const isHeicImage = async (image: string): Promise<boolean> => {
  const heicHeaders = ["ftypmif1", "ftypmsf1", "ftypheic", "ftypheix", "ftyphevc", "ftyphevx"];
  const imageBuffer = await fetch(image).then((response) => response.arrayBuffer());
  const header = new Uint8Array(imageBuffer.slice(4, 12)).reduce(
    (result, byte) => result + String.fromCharCode(byte),
    "",
  );

  return heicHeaders.includes(header);
};

const convertHeicImage = async (image: string): Promise<string> => {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({
    blob: await fetch(image).then((response) => response.blob()),
    toType: "image/png",
  });

  if (Array.isArray(blob)) {
    throw new Error("HEIC conversion returned multiple images");
  }

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.readAsDataURL(blob);
  });
};

export const normalizeImage = async (image: string): Promise<string> => {
  if (await isHeicImage(image)) {
    return convertHeicImage(image);
  }

  return image;
};

export const CropImage = async (
  image: string,
  croppedAreaPixels: Area,
  rotation: number,
): Promise<string | undefined> => {
  try {
    return getCroppedImage(image, croppedAreaPixels, rotation);
  } catch (error) {
    console.error(error);
  }
};
