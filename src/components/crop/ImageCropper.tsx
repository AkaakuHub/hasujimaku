import { useEffect, useState, type FC } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { CropImage } from "./cropUtils";

interface ImageCropperProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isLoading: boolean;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  image: string;
  onCancel: () => void;
  onComplete: (image: string) => void;
  onSkipCrop: () => void;
}

interface Size {
  height: number;
  width: number;
}

type CropOrientation = "landscape" | "portrait";

const getMinimumZoom = (
  mediaSize: Size | null,
  cropSize: Size | null,
  rotation: number,
): number => {
  if (!mediaSize || !cropSize) {
    return 1;
  }

  const rotationRadians = (rotation * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(rotationRadians));
  const sine = Math.abs(Math.sin(rotationRadians));

  return Math.max(
    (cosine * cropSize.width + sine * cropSize.height) / mediaSize.width,
    (sine * cropSize.width + cosine * cropSize.height) / mediaSize.height,
  );
};

const ImageCropper: FC<ImageCropperProps> = ({
  zoom,
  onZoomChange,
  isLoading,
  rotation,
  onRotationChange,
  image,
  onCancel,
  onComplete,
  onSkipCrop,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [mediaSize, setMediaSize] = useState<Size | null>(null);
  const [orientation, setOrientation] = useState<CropOrientation>("landscape");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const aspect = orientation === "landscape" ? 16 / 9 : 9 / 16;
  const minimumZoom = getMinimumZoom(mediaSize, cropSize, rotation);
  const maximumZoom = Math.max(10, minimumZoom);

  useEffect(() => {
    if (zoom < minimumZoom) {
      onZoomChange(minimumZoom);
    }
  }, [minimumZoom, onZoomChange, zoom]);

  const isCropPositionValid = (position: { x: number; y: number }): boolean => {
    if (!cropSize || !mediaSize) {
      return true;
    }

    const rotationRadians = (rotation * Math.PI) / 180;
    const cosine = Math.cos(rotationRadians);
    const sine = Math.sin(rotationRadians);
    const halfImageWidth = (mediaSize.width * zoom) / 2;
    const halfImageHeight = (mediaSize.height * zoom) / 2;

    return [-1, 1].every((horizontalDirection) =>
      [-1, 1].every((verticalDirection) => {
        const x = horizontalDirection * cropSize.width * 0.5 - position.x;
        const y = verticalDirection * cropSize.height * 0.5 - position.y;
        const unrotatedX = x * cosine + y * sine;
        const unrotatedY = -x * sine + y * cosine;

        return Math.abs(unrotatedX) <= halfImageWidth && Math.abs(unrotatedY) <= halfImageHeight;
      }),
    );
  };

  const restrictCropPosition = (position: { x: number; y: number }): { x: number; y: number } => {
    if (isCropPositionValid(position)) {
      return position;
    }

    let lowerBound = 0;
    let upperBound = 1;
    for (let index = 0; index < 20; index += 1) {
      const ratio = (lowerBound + upperBound) / 2;
      const candidate = { x: position.x * ratio, y: position.y * ratio };
      if (isCropPositionValid(candidate)) {
        lowerBound = ratio;
      } else {
        upperBound = ratio;
      }
    }

    return { x: position.x * lowerBound, y: position.y * lowerBound };
  };

  useEffect(() => {
    if (!isCropPositionValid(crop)) {
      setCrop(restrictCropPosition(crop));
    }
  }, [crop, minimumZoom, rotation, zoom]);

  const handleComplete = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    const croppedImage = await CropImage(image, croppedAreaPixels, rotation);
    if (croppedImage) {
      onComplete(croppedImage);
    }
  };

  return (
    <Dialog
      open
      onClose={isLoading ? undefined : onCancel}
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
            position: "relative",
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
          {!isLoading && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              maxZoom={maximumZoom}
              aspect={aspect}
              rotation={rotation}
              restrictPosition
              minZoom={minimumZoom}
              onCropChange={(position) => setCrop(restrictCropPosition(position))}
              onCropSizeChange={setCropSize}
              onCropComplete={(_, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
              setMediaSize={(nextMediaSize) => {
                setMediaSize({ width: nextMediaSize.width, height: nextMediaSize.height });
              }}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
            />
          )}
        </Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          disabled={isLoading}
          value={orientation}
          onChange={(_, nextOrientation: CropOrientation | null) => {
            if (nextOrientation !== null) {
              setOrientation(nextOrientation);
            }
          }}
        >
          <ToggleButton value="landscape" sx={{ height: 42 }}>
            横16:9
          </ToggleButton>
          <ToggleButton value="portrait" sx={{ height: 42 }}>
            縦9:16
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <IconButton
            aria-label="回転をリセット"
            disabled={isLoading}
            size="small"
            onClick={() => onRotationChange(0)}
          >
            <RotateRightIcon color="action" fontSize="small" />
          </IconButton>
          <Slider
            value={rotation}
            disabled={isLoading}
            min={-180}
            max={180}
            step={1}
            onChange={(_, newValue) => {
              if (typeof newValue === "number") {
                onRotationChange(newValue);
              }
            }}
          />
        </Box>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <IconButton
            aria-label="拡大率をリセット"
            disabled={isLoading}
            size="small"
            onClick={() => onZoomChange(minimumZoom)}
          >
            <ZoomInIcon color="action" fontSize="small" />
          </IconButton>
          <Slider
            value={zoom}
            disabled={isLoading}
            min={minimumZoom}
            max={maximumZoom}
            step={0.05}
            onChange={(_, newValue) => {
              if (typeof newValue === "number") {
                onZoomChange(newValue);
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button disabled={isLoading} onClick={onCancel}>
          キャンセル
        </Button>
        <Button disabled={isLoading} onClick={onSkipCrop}>
          元画像を使用
        </Button>
        <Button disabled={isLoading} variant="contained" onClick={handleComplete}>
          決定
        </Button>
      </DialogActions>
      {isLoading && (
        <Box
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            inset: 0,
            position: "absolute",
            zIndex: 1,
          }}
        />
      )}
      {isLoading && (
        <Box
          sx={{
            left: "50%",
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}
    </Dialog>
  );
};

export default ImageCropper;
