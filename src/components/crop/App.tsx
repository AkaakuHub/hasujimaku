import { useState, type FC } from "react";
import ImageUploading, { type ImageListType } from "react-images-uploading";
import Cropper, { type Area } from "react-easy-crop";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  type ButtonProps,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { CropImage } from "./cropUtils";

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

interface ImageCropperProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  open: boolean;
  image: string;
  onCancel: () => void;
  onComplete: (image: string) => void;
}

const ImageCropper: FC<ImageCropperProps> = ({
  zoom,
  onZoomChange,
  open,
  image,
  onCancel,
  onComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const maxZoom = 10;

  const handleComplete = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    const croppedImage = await CropImage(image, croppedAreaPixels);
    if (croppedImage) {
      onComplete(croppedImage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
            height: { xs: "100dvh", sm: "min(720px, calc(100dvh - 64px))" },
            m: { xs: 0, sm: 4 },
          },
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0 }}>画像をクロップ</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: 2,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{ position: "relative", flex: 1, minHeight: 0, width: "100%", bgcolor: "grey.900" }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            maxZoom={maxZoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onCropComplete={(_, croppedAreaPixels) => {
              setCroppedAreaPixels(croppedAreaPixels);
            }}
            onZoomChange={onZoomChange}
          />
        </Box>
        <Slider
          value={zoom}
          min={1}
          max={maxZoom}
          step={0.05}
          onChange={(_, newValue) => {
            if (typeof newValue === "number") {
              onZoomChange(newValue);
            }
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>キャンセル</Button>
        <Button variant="contained" onClick={handleComplete}>
          決定
        </Button>
      </DialogActions>
    </Dialog>
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
      <ImageCropper
        zoom={zoom}
        onZoomChange={setZoom}
        open={dialogOpen}
        image={selectedImage}
        onCancel={() => setDialogOpen(false)}
        onComplete={(croppedImage) => {
          setCroppedImage(croppedImage);
          setBaseImageBase64(croppedImage);
          setDialogOpen(false);
        }}
      />
      {croppedImage !== "" && (
        <Box
          component="img"
          src={croppedImage}
          alt="切り抜いた画像"
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
