import { useEffect, useState } from "react";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import { readImagePixels } from "../../lib/imagePixels";
import { detectTrustMark } from "../../lib/trustMarkRuntime";
import { trustMarkDetectionThreshold, type TrustMarkDetection } from "../../lib/trustMark";

interface VerificationResult extends TrustMarkDetection {
  fileName: string;
}

const WatermarkVerifier = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const verifyImage = async (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setResult(null);
    setError(null);

    try {
      const { height, pixels, width } = await readImagePixels(file);
      setResult({ ...(await detectTrustMark(pixels, width, height)), fileName: file.name });
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "画像を検証できませんでした。",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card sx={{ width: "100%", maxWidth: 720, borderRadius: 5 }}>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" component="h2" gutterBottom>
              透かしを検証
            </Typography>
            <Typography variant="body2">
              画像の画素に埋め込まれた活動記録字幕ジェネレーターの識別信号を確認します。
            </Typography>
          </Box>
          <Button component="label" variant="contained" startIcon={<ImageSearchIcon />}>
            画像を選択
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void verifyImage(file);
                }
                event.target.value = "";
              }}
            />
          </Button>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="検証する画像"
              sx={{ display: "block", width: "100%", maxHeight: 420, objectFit: "contain" }}
            />
          )}
          {isVerifying && <CircularProgress aria-label="透かしを検証中" />}
          {result && (
            <Alert severity={result.detected ? "success" : "info"} sx={{ width: "100%" }}>
              <Typography sx={{ fontWeight: 700 }}>
                {result.detected
                  ? "このツールで作成された画像です。"
                  : "このツールの透かしを確認できませんでした。"}
              </Typography>
              <Typography variant="body2">
                {result.fileName}・信号一致率{Math.round(result.matchRate * 100)}%（判定基準
                {Math.round(trustMarkDetectionThreshold * 100)}%以上）
              </Typography>
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            画像は端末内だけで処理され、外部へ送信されません。
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WatermarkVerifier;
