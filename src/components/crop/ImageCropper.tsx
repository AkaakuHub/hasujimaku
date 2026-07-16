import { useState, type FC } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { CropImage } from "./cropUtils";

interface ImageCropperProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  image: string;
  onCancel: () => void;
  onComplete: (image: string) => void;
}

const ImageCropper: FC<ImageCropperProps> = ({
  zoom,
  onZoomChange,
  image,
  onCancel,
  onComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      open
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
            maxZoom={10}
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
          max={10}
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

export default ImageCropper;
