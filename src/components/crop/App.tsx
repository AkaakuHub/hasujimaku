import { lazy, Suspense, useRef, useState, type FC } from "react";
import ImageUploading, { type ImageListType } from "react-images-uploading";
import { Box, Button, type ButtonProps } from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import { normalizeImage } from "./cropUtils";

const ImageCropper = lazy(() => import("./ImageCropper"));

interface ImageUploadingButtonProps extends Omit<ButtonProps, "onChange" | "value"> {
  value: ImageListType;
  onChange: (image: ImageListType) => void;
}

const ImageUploadingButton: FC<ImageUploadingButtonProps> = ({ value, onChange, ...props }) => {
  return (
    <ImageUploading value={value} onChange={onChange}>
      {({ onImageUpload, onImageUpdate }) => (
        <Button
          color="primary"
          onClick={value.length === 0 ? onImageUpload : () => onImageUpdate(0)}
          startIcon={<FileUploadIcon />}
          {...props}
        >
          画像を選択
        </Button>
      )}
    </ImageUploading>
  );
};

interface Props {
  setBaseImageBase64: (image: string) => void;
}

const App: FC<Props> = ({ setBaseImageBase64 }) => {
  const [image, setImage] = useState<ImageListType>([]);
  const [croppedImage, setCroppedImage] = useState<string>("");
  const [cropImage, setCropImage] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const imageSelectionId = useRef(0);

  const applyImageWithoutCrop = () => {
    setCroppedImage(cropImage);
    setBaseImageBase64(cropImage);
    setDialogOpen(false);
  };

  const handleImageChange = async (newImage: ImageListType) => {
    const selectionId = imageSelectionId.current + 1;
    imageSelectionId.current = selectionId;
    setImage(newImage);
    setZoom(1);
    setRotation(0);

    const selectedImage = newImage[0]?.dataURL ?? "";
    if (selectedImage === "") {
      setDialogOpen(false);
      setIsNormalizing(false);
      setCropImage("");
      setCroppedImage("");
      setBaseImageBase64("");
      return;
    }

    setCropImage("");
    setIsNormalizing(true);
    setDialogOpen(true);

    try {
      const normalizedImage = await normalizeImage(selectedImage);
      if (imageSelectionId.current !== selectionId) {
        return;
      }

      setCropImage(normalizedImage);
      setIsNormalizing(false);
    } catch {
      if (imageSelectionId.current !== selectionId) {
        return;
      }

      setCropImage("");
      setCroppedImage("");
      setBaseImageBase64("");
      setIsNormalizing(false);
      setDialogOpen(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, my: 2 }}>
      {dialogOpen && (
        <Suspense>
          <ImageCropper
            zoom={zoom}
            onZoomChange={setZoom}
            isLoading={isNormalizing}
            rotation={rotation}
            onRotationChange={setRotation}
            image={cropImage}
            onCancel={() => setDialogOpen(false)}
            onSkipCrop={applyImageWithoutCrop}
            onComplete={(croppedImage) => {
              setCroppedImage(croppedImage);
              setBaseImageBase64(croppedImage);
              setDialogOpen(false);
            }}
          />
        </Suspense>
      )}
      {croppedImage !== "" && (
        <Box
          component="img"
          src={croppedImage}
          alt="切り抜いた画像"
          width={200}
          height={113}
          sx={{ width: 200, height: "auto", border: 2, borderColor: "common.black" }}
        />
      )}
      <ImageUploadingButton
        value={image}
        onChange={(newImage) => void handleImageChange(newImage)}
      />
    </Box>
  );
};

export default App;
