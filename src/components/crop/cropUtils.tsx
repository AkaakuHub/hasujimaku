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

export const CropImage = async (image: string, croppedAreaPixels: PixelCrop, onError: (error: Error) => void): Promise<string | undefined> => {
  if (typeof window !== "undefined") {
    try {
      // alert(`imageBefore: ${image}`);
      // iphoneで、heic形式の画像を読み込むための処理
      // アップロード時にdata:image:jpegになっていたが、
      // それでも正しく表示されていない
      // なので、iosかつdata:image/jpegの場合は、heic2anyで変換する
      const HEIC_MAGIC_HEADERS: string[] = ["ftypmif1", "ftypmsf1", "ftypheic", "ftypheix", "ftyphevc", "ftyphevx"];
      // imageはbase64形式なのでimagebufferに変換して判定する
      const imageBuffer = Buffer.from(image, "base64");
      const heicRange = imageBuffer.slice(4, 12);

      const heicRangeHeader = heicRange.reduce(
        (acc, byte) => acc += String.fromCharCode(byte),
        ""
      );

      const isHeic = HEIC_MAGIC_HEADERS.includes(heicRangeHeader);

      if (isHeic) {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({
          blob: await fetch(image).then((r) => r.blob()),
          toType: "image/png",
        });
        // imageを、新しいblobで上書き
        if (!Array.isArray(blob)) {
          // imageのbase64を更新する
          image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
          });
          // alert(`imageAfter: ${image}`);
        }
        // alert(`imageAfter: ${image}`);
      }
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      return croppedImage;
    } catch (err) {
      onError(err as Error);
    }
  };
};
