import type { FC, ReactNode } from "react";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Button, type ButtonProps } from "@mui/material";

interface ImageSelectButtonProps extends Omit<ButtonProps, "children" | "startIcon"> {
  children?: ReactNode;
}

const ImageSelectButton: FC<ImageSelectButtonProps> = ({ children, ...buttonProps }) => (
  <Button variant="contained" startIcon={<FileUploadIcon />} {...buttonProps}>
    画像を選択
    {children}
  </Button>
);

export default ImageSelectButton;
