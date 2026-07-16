import { lazy, Suspense, useState, type FC } from "react";
import ImageUploading, { type ImageListType } from "react-images-uploading";
import { Box, Button, type ButtonProps } from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const selectedImage = image[0]?.dataURL ?? "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, my: 2 }}>
      {dialogOpen && (
        <Suspense>
          <ImageCropper
            zoom={zoom}
            onZoomChange={setZoom}
            image={selectedImage}
            onCancel={() => setDialogOpen(false)}
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
          sx={{ width: 200, border: 2, borderColor: "common.black" }}
        />
      )}
      <ImageUploadingButton
        value={image}
        onChange={(newImage) => {
          setDialogOpen(true);
          setImage(newImage);
          setZoom(1);
        }}
      />
    </Box>
  );
};

export default App;
