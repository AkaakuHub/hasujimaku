import { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImage = async (imageSource: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSource);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create 2d context");
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;
  context.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);

  const imageData = context.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  context.putImageData(
    imageData,
    Math.round(-safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(-safeArea / 2 + image.height * 0.5 - pixelCrop.y),
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

export const CropImage = async (
  image: string,
  croppedAreaPixels: Area,
): Promise<string | undefined> => {
  try {
    const sourceImage = (await isHeicImage(image)) ? await convertHeicImage(image) : image;
    return getCroppedImage(sourceImage, croppedAreaPixels);
  } catch (error) {
    console.error(error);
  }
};
