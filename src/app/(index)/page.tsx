import { useDeferredValue, useEffect, useState } from "react";
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
import IosShareIcon from "@mui/icons-material/IosShare";
import "@fontsource/klee-one/400.css";

import CropApp from "../../components/crop/App";
import Footer from "../../components/footer/footer";
import Header from "../../components/header/header";
import ImageCanvas from "../../components/imageCanvas/ImageCanvas";
import { getUnsupportedKleeOneCharacters } from "../../lib/kleeOneUnsupportedCharacters";
import { shareText } from "../../lib/shareText";
import { shareImage } from "../../lib/shareImage";
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
  const [resultImageUrl, setResultImageUrl] = useState("/card.webp");
  const [isFetching, setIsFetching] = useState(false);
  const [renderingError, setRenderingError] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<string[]>(["", ""]);
  const [themeName, setThemeName] = useState("");
  const deferredQuote = useDeferredValue(queryData.quote);
  const deferredName = useDeferredValue(queryData.name);
  const unsupportedCharacters = getUnsupportedKleeOneCharacters(queryData.quote, queryData.name);

  const changeThemeColor = () => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    setThemeColors([...theme.colors]);
    setThemeName(theme.name);
  };

  const canRender = unsupportedCharacters.length === 0;
  const canUseResult =
    canRender && renderingError === null && !isFetching && resultImageUrl !== "/card.webp";

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
                    error={unsupportedCharacters.length > 0}
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
                    error={unsupportedCharacters.length > 0}
                    value={queryData.name}
                    onChange={(event) => {
                      setQueryData({ ...queryData, name: event.target.value });
                    }}
                  />
                  {unsupportedCharacters.length > 0 && (
                    <Typography color="error" variant="body2">
                      Klee Oneに対応していない文字があります:
                      <Box component="span" sx={{ fontFamily: "system-ui" }}>
                        「{unsupportedCharacters.join("、")}」
                      </Box>
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ textAlign: "center" }}>
                    ※セリフは2行まで
                  </Typography>
                  {baseImageBase64 === "" && (
                    <Typography variant="body2" sx={{ textAlign: "center" }}>
                      まず、画像を選択してください。
                    </Typography>
                  )}
                  {renderingError !== null && (
                    <Typography color="error" variant="body2">
                      {renderingError}
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
                  <ImageCanvas
                    baseImageBase64={baseImageBase64}
                    canRender={canRender}
                    quote={deferredQuote}
                    name={deferredName}
                    setRenderingError={setRenderingError}
                    setResultImageUrl={setResultImageUrl}
                    setIsFetching={setIsFetching}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      color="info"
                      disabled={!canUseResult}
                      startIcon={<IosShareIcon />}
                      sx={{ alignSelf: "stretch", flex: 1 }}
                      onClick={async () => {
                        const response = await fetch(resultImageUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "hasunosora_jimaku.png", {
                          type: "image/png",
                        });
                        await shareImage(() => navigator.share({ text: shareText, files: [file] }));
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
            使用フォント:Klee One
          </Typography>
        </Stack>
      </Box>
      <Footer themeName={themeName} />
    </Box>
  );
}
