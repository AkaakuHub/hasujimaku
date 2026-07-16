import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import IosShareIcon from "@mui/icons-material/IosShare";
import "@fontsource/klee-one/400.css";

import CropApp from "../../components/crop/App";
import Footer from "../../components/footer/footer";
import Header from "../../components/header/header";
import ImageCanvas from "../../components/imageCanvas/ImageCanvas";
import { shareText } from "../../lib/shareText";
import { themes } from "../../lib/themes";
import { hasAtMostTwoLines } from "../../lib/quote";
import { queryType } from "../../types";

const cardSx = {
  width: "100%",
  borderRadius: 5,
};

export default function Page() {
  const [queryData, setQueryData] = useState<queryType>({
    quote: "",
    name: "",
    baseImageBase64: "",
  });
  const [baseImageBase64, setBaseImageBase64] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("/card.png");
  const [isFetching, setIsFetching] = useState(false);
  const [themeColors, setThemeColors] = useState<string[]>(["", ""]);
  const [themeName, setThemeName] = useState("");

  const changeThemeColor = () => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    setThemeColors([...theme.colors]);
    setThemeName(theme.name);
  };

  const canUseResult = !isFetching && resultImageUrl !== "/card.png";

  useEffect(() => {
    changeThemeColor();
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
            <CardContent sx={{ textAlign: "center" }}>
              <Typography>活動記録の字幕風の画像を生成します。</Typography>
            </CardContent>
          </Card>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={4}
            sx={{ width: "100%", alignItems: "stretch" }}
          >
            <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "center" }}>
                  1.画像を選択
                </Typography>
                <CropApp setBaseImageBase64={setBaseImageBase64} />
              </CardContent>
            </Card>

            <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5" component="h2" sx={{ textAlign: "center" }}>
                    2.情報を入力
                  </Typography>
                  <TextField
                    label="セリフ"
                    multiline
                    minRows={2}
                    maxRows={2}
                    placeholder="セリフを入力"
                    value={queryData.quote}
                    onChange={(event) => {
                      if (hasAtMostTwoLines(event.target.value)) {
                        setQueryData({ ...queryData, quote: event.target.value });
                      }
                    }}
                  />
                  <TextField
                    label="名前"
                    placeholder="名前を入力"
                    value={queryData.name}
                    onChange={(event) => {
                      setQueryData({ ...queryData, name: event.target.value });
                    }}
                  />
                  <Typography variant="body2" sx={{ textAlign: "center" }}>
                    ※セリフは2行まで
                  </Typography>
                  {baseImageBase64 === "" && (
                    <Typography variant="body2" sx={{ textAlign: "center" }}>
                      まず、画像を選択してください。
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", height: 40, alignItems: "center" }}>
                    {isFetching && <CircularProgress size={32} />}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ ...cardSx, flex: 1, minWidth: 0 }}>
              <CardContent>
                <Stack spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    component="img"
                    src={resultImageUrl}
                    alt="生成した画像"
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      border: 2,
                      borderColor: "common.black",
                      filter: isFetching ? "brightness(0.6)" : "none",
                    }}
                  />
                  <ImageCanvas
                    baseImageBase64={baseImageBase64}
                    quote={queryData.quote}
                    name={queryData.name}
                    setResultImageUrl={setResultImageUrl}
                    setIsFetching={setIsFetching}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
                    <Box
                      component="a"
                      href={canUseResult ? resultImageUrl : undefined}
                      download="hasunosora_jimaku.png"
                      sx={{ textDecoration: "none" }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        disabled={!canUseResult}
                        startIcon={<DownloadIcon />}
                      >
                        画像をダウンロード
                      </Button>
                    </Box>
                    <Button
                      variant="contained"
                      color="info"
                      disabled={!canUseResult}
                      startIcon={<IosShareIcon />}
                      onClick={async () => {
                        const response = await fetch(resultImageUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "hasunosora_jimaku.png", {
                          type: "image/png",
                        });
                        await navigator.share({ text: shareText, files: [file] });
                      }}
                    >
                      画像を共有
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Card sx={{ ...cardSx, maxWidth: 600 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography>使用フォント:Klee One</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
      <Footer themeName={themeName} />
    </Box>
  );
}
