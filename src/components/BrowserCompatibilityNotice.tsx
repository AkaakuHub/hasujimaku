import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

interface BrowserCompatibilityNoticeProps {
  unsupportedFeatures: string[];
}

const BrowserCompatibilityNotice = ({ unsupportedFeatures }: BrowserCompatibilityNoticeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(unsupportedFeatures.length > 0);
  }, [unsupportedFeatures]);

  return (
    <Snackbar open={isOpen} anchorOrigin={{ horizontal: "center", vertical: "bottom" }}>
      <Alert severity="warning" variant="filled" onClose={() => setIsOpen(false)}>
        お使いの環境では画像処理に必要な機能を利用できない可能性があります（
        {unsupportedFeatures.join("、")}）。
      </Alert>
    </Snackbar>
  );
};

export default BrowserCompatibilityNotice;
