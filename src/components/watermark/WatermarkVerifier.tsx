import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

import ImageSelectButton from "../design/ImageSelectButton";
import { preloadWatermarkVerifier, verifyWatermarkImage } from "../../lib/imageProcessor";
import { trustMarkDetectionThreshold } from "../../lib/trustMark";
import { type WatermarkVerificationResult, verifyWatermark } from "../../lib/watermarkVerification";

const WatermarkVerifier = () => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<WatermarkVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void preloadWatermarkVerifier()
      .catch((modelError: unknown) => {
        if (active) {
          setError(
            modelError instanceof Error
              ? modelError.message
              : "透かしモデルを読み込めませんでした。",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsModelLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
      setResult(await verifyWatermark(file, verifyWatermarkImage));
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
            <Typography variant="body2" gutterBottom>
              このツールで作られた画像かどうかを確認します。
            </Typography>
            <Typography variant="body2">
              画像が劣化したり、強く加工されたりすると、正しく判定できない場合があります。
            </Typography>
          </Box>
          <ImageSelectButton component="label">
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
          </ImageSelectButton>
          {isModelLoading && (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <CircularProgress size={24} aria-label="検証モデルを読み込み中" />
              <Typography variant="body2">検証モデルを読み込んでいます。</Typography>
            </Stack>
          )}
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
            <Alert
              severity={result.detected ? "success" : "info"}
              sx={{ width: "100%", alignItems: "center", "& .MuiAlert-icon": { py: 0 } }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {result.detected
                  ? "このツールで作成された画像です。"
                  : "このツールの透かしを確認できませんでした。"}
              </Typography>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {result.fileName}
              </Typography>
              <Typography variant="body2">
                信号一致率{Math.round(result.matchRate * 100)}%（判定基準
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
