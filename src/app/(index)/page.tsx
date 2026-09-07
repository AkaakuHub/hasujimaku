import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import "@fontsource/klee-one/400.css";

import CropApp from "../../components/crop/App";
import BrowserCompatibilityNotice from "../../components/BrowserCompatibilityNotice";
import Footer from "../../components/footer/footer";
import Header from "../../components/header/header";
import ImageCanvas from "../../components/imageCanvas/ImageCanvas";
import ImageDetailsForm, { type ImageDetails } from "../../components/imageCanvas/ImageDetailsForm";
import LazyLoadBoundary from "../../components/LazyLoadBoundary";
import {
  checkImageProcessorCompatibility,
  preloadImageRenderer,
  preloadWatermarkVerifier,
} from "../../lib/imageProcessor";
import { shareText } from "../../lib/shareText";
import { shareImage } from "../../lib/shareImage";
import { themes } from "../../lib/themes";
import { queryType } from "../../types";
import ItemList from "../../components/design/ItemList";

const cardSx = {
  width: "100%",
  borderRadius: 5,
};

const WatermarkVerifier = lazy(() => import("../../components/watermark/WatermarkVerifier"));

export default function Page() {
  const [baseImageBase64, setBaseImageBase64] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<string[]>(["", ""]);
  const [themeName, setThemeName] = useState("");
  const [isCurrentInput, setIsCurrentInput] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [renderInput, setRenderInput] = useState<queryType | null>(null);
  const [renderRequestId, setRenderRequestId] = useState(0);
  const [unsupportedBrowserFeatures, setUnsupportedBrowserFeatures] = useState<string[]>([]);
  const changeThemeColor = () => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    setThemeColors([...theme.colors]);
    setThemeName(theme.name);
  };

  const canUseResult =
    isCurrentInput &&
    renderInput?.baseImageBase64 === baseImageBase64 &&
    renderingError === null &&
    !isFetching &&
    resultImageUrl !== "";
  const confirmImageDetails = useCallback(
    (details: ImageDetails) => {
      setRenderInput({ baseImageBase64, ...details });
      setRenderRequestId((requestId) => requestId + 1);
    },
    [baseImageBase64],
  );

  useEffect(() => {
    changeThemeColor();
    let active = true;

    void checkImageProcessorCompatibility()
      .then((unsupportedFeatures) => {
        if (active) {
          setUnsupportedBrowserFeatures(unsupportedFeatures);
          if (unsupportedFeatures.length === 0) {
            preloadImageRenderer();
          }
        }
      })
      .catch(() => {
        if (active) {
          setUnsupportedBrowserFeatures(["画像処理Worker"]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", flexDirection: "column" }}>
      <Header themeColor={themeColors[1]} changeThemeColor={changeThemeColor} />
      <Box
        component="main"
        sx={{
          flex: 1,
          background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]})`,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 5 },
        }}
      >
        <Stack spacing={4} sx={{ mx: "auto", maxWidth: 1520, alignItems: "center" }}>
          <Card sx={{ ...cardSx, maxWidth: 600 }}>
            <Tabs
              value={selectedTab}
              onChange={(_, value: number) => {
                if (value === 1) {
                  void preloadWatermarkVerifier().catch(() => undefined);
                }
                setSelectedTab(value);
              }}
              variant="fullWidth"
              aria-label="機能を選択"
            >
              <Tab label="画像を作成" />
              <Tab label="透かしを検証" />
            </Tabs>
          </Card>
          <Stack
            spacing={4}
            sx={{
              display: selectedTab === 0 ? "flex" : "none",
              width: "100%",
              alignItems: "center",
            }}
          >
            <Card sx={{ ...cardSx, maxWidth: 600 }}>
              <CardContent>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  活動記録の字幕風の画像を生成します。
                </Typography>
                {ItemList({
                  items: [
                    "画像はすべてローカルで処理されます。",
                    "公序良俗の範囲でお使いください。",
                    "作成された画像に関して、当サイトは一切の責任を負いません。",
                  ],
                })}
              </CardContent>
            </Card>

            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={4}
              sx={{ width: "100%", alignItems: "stretch" }}
            >
              <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
                <CardContent sx={{ paddingBottom: "0!important" }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "center" }}>
                    1.画像を選択
                  </Typography>
                  <CropApp setBaseImageBase64={setBaseImageBase64} />
                </CardContent>
              </Card>

              <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
                <CardContent>
                  <ImageDetailsForm
                    baseImageBase64={baseImageBase64}
                    confirmedDetails={renderInput}
                    isFetching={isFetching}
                    renderingError={renderingError}
                    onCurrentChange={setIsCurrentInput}
                    onConfirm={confirmImageDetails}
                  />
                </CardContent>
              </Card>

              <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
                <CardContent>
                  <Stack spacing={2} sx={{ alignItems: "center" }}>
                    {resultImageUrl === "" ? (
                      <Box
                        sx={{
                          display: "flex",
                          width: "100%",
                          maxWidth: 720,
                          aspectRatio: "16 / 9",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#ddd",
                          border: 2,
                          borderColor: "common.black",
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            px: 2,
                            textAlign: "center",
                            fontSize: { xs: "1rem", sm: "1.5rem" },
                          }}
                        >
                          ここに画像が生成されます
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={resultImageUrl}
                        alt="生成した画像"
                        width={720}
                        height={405}
                        sx={{
                          width: "100%",
                          height: "auto",
                          maxWidth: 720,
                          border: 2,
                          borderColor: "common.black",
                        }}
                      />
                    )}
                    <ImageCanvas
                      baseImageBase64={renderInput?.baseImageBase64 ?? ""}
                      canRender={renderInput !== null}
                      quote={renderInput?.quote ?? ""}
                      name={renderInput?.name ?? ""}
                      renderRequestId={renderRequestId}
                      setRenderingError={setRenderingError}
                      setResultImageUrl={setResultImageUrl}
                      setIsFetching={setIsFetching}
                    />
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ width: "100%" }}
                    >
                      <Button
                        variant="contained"
                        color="info"
                        disabled={!canUseResult}
                        startIcon={<IosShareIcon />}
                        sx={{ alignSelf: "stretch", flex: 1, height: 48 }}
                        onClick={async () => {
                          const response = await fetch(resultImageUrl);
                          const blob = await response.blob();
                          const file = new File([blob], "hasunosora_jimaku.png", {
                            type: "image/png",
                          });
                          await shareImage(() =>
                            navigator.share({ text: shareText, files: [file] }),
                          );
                        }}
                      >
                        画像を共有
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
            <Typography variant="body2" sx={{ color: "common.black" }}>
              使用フォント:
              <Link
                href="https://fonts.google.com/specimen/Klee+One"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ ml: 0.5 }}
              >
                Klee One
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              生成画像には不可視の透かしが入ります。
            </Typography>
          </Stack>
          {selectedTab === 1 && (
            <LazyLoadBoundary
              fallback={<Alert severity="error">検証機能を読み込めませんでした。</Alert>}
            >
              <Suspense fallback={<CircularProgress aria-label="検証機能を読み込み中" />}>
                <WatermarkVerifier />
              </Suspense>
            </LazyLoadBoundary>
          )}
        </Stack>
      </Box>
      <Footer themeName={themeName} />
      <BrowserCompatibilityNotice unsupportedFeatures={unsupportedBrowserFeatures} />
    </Box>
  );
}
