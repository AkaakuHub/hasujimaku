/* eslint-disable @next/next/no-img-element */
import React, { useState, FC } from "react";
import ImageUploading, { ImageListType, ImageType } from "react-images-uploading";
import Cropper, { Area } from "react-easy-crop";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { cropImage } from "./cropUtils";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Slider } from "@mui/material";


import styles from "./style.module.scss";

interface ImageUploadingButtonProps {
  value: ImageListType;
  onChange: (image: ImageListType) => void;
  [x: string]: any;
}

const ImageUploadingButton: FC<ImageUploadingButtonProps> = ({ value, onChange, ...props }) => {
  return (
    <ImageUploading value={value} onChange={onChange}>
      {({ onImageUpload, onImageUpdate }) => (
        <Button
          color="primary"
          onClick={value ? onImageUpload : () => onImageUpdate(0)}
          {...props}
        >
          <FileUploadIcon />
          画像を選択
        </Button>
      )}
    </ImageUploading>
  );
};

interface ImageCropperProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  open: boolean;
  image: string;
  onComplete: (image: Promise<string>) => void;
  containerStyle: React.CSSProperties;
  [x: string]: any;
}

const ImageCropper: FC<ImageCropperProps> = ({
  zoom,
  setZoom,
  open,
  image,
  onComplete,
  containerStyle,
  ...props
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const maxZoom: number = 10;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>画像をクロップ</DialogTitle>
      <DialogContent>
        <div style={containerStyle}>
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
            onZoomChange={setZoom}
            {...props}
          />
        </div>
        <Slider
          value={zoom}
          min={1}
          max={maxZoom}
          step={0.05}
          onChange={(event, newValue) => {
            setZoom(newValue as number);
            // console.log(newValue);
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button
          color="primary"
          onClick={() =>
            // @ts-ignore
            onComplete(cropImage(image, croppedAreaPixels ?? {}, console.log))
          }
        >
          決定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface Props {
  setBaseImageBase64: (image: string) => void;
};

const App: FC<Props> = ({
  setBaseImageBase64,
}) => {
  const [image, setImage] = useState<ImageListType>([]);
  const [croppedImage, setCroppedImage] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState<number>(1);

  return (
    <div className={styles["root"]}>
      <ImageCropper
        zoom={zoom}
        setZoom={setZoom}
        open={dialogOpen}
        image={image.length > 0 ? image[0].dataURL as string : ""}
        onComplete={(imagePromise) => {
          imagePromise.then((image) => {
            if (image === null || image === "") return;
            setCroppedImage(image); // base64で入ってる、ラッキー
            setBaseImageBase64(image);
            setDialogOpen(false);
          });
        }}
        containerStyle={{
          position: "relative",
          width: "100%",
          height: 500,
          background: "#333",
        }}
      />
      {croppedImage !== "" && (
        <img src={croppedImage} alt="Cropped image" className={styles["cropped-image"]} />
      )}
      <ImageUploadingButton
        value={image}
        onChange={(newImage) => {
          setDialogOpen(true);
          setImage(newImage);
          setZoom(1);
        }}
      />
    </div>
  );
}

export default App;
