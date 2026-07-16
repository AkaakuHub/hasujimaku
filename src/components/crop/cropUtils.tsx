import { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue: number): number => (degreeValue * Math.PI) / 180;

const getRotatedSize = (
  width: number,
  height: number,
  rotation: number,
): { height: number; width: number } => {
  const rotationRadians = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotationRadians) * width) + Math.abs(Math.sin(rotationRadians) * height),
    height:
      Math.abs(Math.sin(rotationRadians) * width) + Math.abs(Math.cos(rotationRadians) * height),
  };
};

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

  const safeArea = Math.ceil(Math.max(image.width, image.height) * Math.SQRT2);
  const safeCanvas = document.createElement("canvas");
  safeCanvas.width = safeArea;
  safeCanvas.height = safeArea;
  const safeContext = safeCanvas.getContext("2d");

  if (!safeContext) {
    throw new Error("Unable to create 2d context");
  }

  safeContext.translate(safeArea / 2, safeArea / 2);
  safeContext.rotate(getRadianAngle(rotation));
  safeContext.drawImage(image, -image.width / 2, -image.height / 2);

  const rotatedImageSize = getRotatedSize(image.width, image.height, rotation);
  const cropX = Math.round(pixelCrop.x);
  const cropY = Math.round(pixelCrop.y);
  const cropWidth = Math.round(pixelCrop.width);
  const cropHeight = Math.round(pixelCrop.height);
  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error("Invalid crop dimensions");
  }

  const imageData = safeContext.getImageData(0, 0, safeArea, safeArea);
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  context.putImageData(
    imageData,
    Math.round(-safeArea / 2 + rotatedImageSize.width / 2 - cropX),
    Math.round(-safeArea / 2 + rotatedImageSize.height / 2 - cropY),
  );

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
