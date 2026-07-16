import GlobalStyle from "../../lib/GlobalStyle";
import "@fontsource/klee-one/400.css";

import { useEffect, useState } from "react";
import { Input, Button } from "@mui/material";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import DownloadIcon from "@mui/icons-material/Download";
import IosShareIcon from "@mui/icons-material/IosShare";

import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

import "react-image-crop/dist/ReactCrop.css";

import { queryType } from "../../types";

import styles from "./style.module.scss";
import CropApp from "../../components/crop/App";

import ImageCanvas from "../../components/imageCanvas/ImageCanvas";
import { shareText } from "../../lib/shareText";
import { themes } from "../../lib/themes";

export default function Page() {
  const [queryData, setQueryData] = useState<queryType>({
    quote: "",
    name: "",
    baseImageBase64: "",
  });

  const [baseImageBase64, setBaseImageBase64] = useState<string>("");

  const [resultImageUrl, setResultImageUrl] = useState<string>("/card.png");

  const [isFetching, setIsFetching] = useState<boolean>(false);

  const [themeColors, setThemeColors] = useState<string[]>(["", ""]);
  const [themeName, setThemeName] = useState<string>("");

  const changeThemeColor = () => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    setThemeColors([...theme.colors]);
    setThemeName(theme.name);
  };

  useEffect(() => {
    changeThemeColor();
  }, []);

  return (
    <>
      <GlobalStyle />
      <Header themeColor={themeColors[1]} changeThemeColor={changeThemeColor} />
      <div
        className={styles["root"]}
        style={{
          background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]})`,
        }}
      >
        <Card
          sx={{
            minWidth: 275,
            maxWidth: 600,
            maxHeight: "6em",
            borderRadius: 5,
          }}
        >
          <p className={styles["description"]}>活動記録の字幕風の画像を生成します。</p>
        </Card>
        <div className={styles["workspace-container"]}>
          <Card
            sx={{
              minWidth: 275,
              maxWidth: 600,
              maxHeight: 410,
              borderRadius: 5,
            }}
          >
            <div className={styles["card-title"]}>1.画像を選択</div>
            <CropApp setBaseImageBase64={setBaseImageBase64} />
          </Card>
          <Card
            sx={{
              minWidth: 300,
              maxWidth: 1000,
              borderRadius: 5,
            }}
          >
            <div className={styles["card-title"]}>2.情報を入力</div>
            <div className={styles["input-container"]}>
              <CardContent>
                <div className={styles["select-container"]}>
                  <span>セリフ:</span>
                  <Input
                    multiline
                    type="text"
                    placeholder="セリフを入力"
                    value={queryData.quote}
                    onChange={(e) => {
                      if (e.target.value.split("\n").length > 2) {
                        return;
                      }
                      const newQueryData = { ...queryData, quote: e.target.value };
                      setQueryData(newQueryData);
                    }}
                    sx={{
                      fontFamily: "'Klee One'!important",
                      fontWeight: "400!important",
                    }}
                  />
                </div>
                <br />
                <div className={styles["select-container"]}>
                  <span>名前:</span>
                  <Input
                    type="text"
                    placeholder="名前を入力"
                    value={queryData.name}
                    onChange={(e) => {
                      setQueryData((oldQueryData) => {
                        return { ...oldQueryData, name: e.target.value };
                      });
                    }}
                    sx={{
                      fontFamily: "'Klee One'!important",
                      fontWeight: "400!important",
                    }}
                  />
                </div>
                <br />
                <p>※セリフは2行まで</p>
                <br />
                {baseImageBase64 === "" && <p>まず、画像を選択してください。</p>}
              </CardContent>
              <CardActions>
                <div className={styles["button-container"]}>
                  <div className={styles["select-container-row2"]}>
                    {isFetching ? (
                      <Box sx={{ display: "flex" }} className={styles["loading-icon-container"]}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <div className={styles["loading-icon-container"]}></div>
                    )}
                  </div>
                </div>
              </CardActions>
            </div>
          </Card>
          <Card
            sx={{
              minWidth: 275,
              maxWidth: 600,
              maxHeight: 510,
              borderRadius: 5,
            }}
          >
            <div className={styles["result-container"]}>
              <img
                src={resultImageUrl}
                alt="Generated Image"
                className={`${styles["generated-image"]} ${isFetching ? styles["image-dark"] : ""}`}
              />
              <ImageCanvas
                baseImageBase64={baseImageBase64}
                quote={queryData.quote}
                name={queryData.name}
                setResultImageUrl={setResultImageUrl}
                setIsFetching={setIsFetching}
              />
              <div className={styles["result-button-container"]}>
                <a
                  href={isFetching || resultImageUrl === "/card.png" ? undefined : resultImageUrl}
                  download="hasunosora_jimaku.png"
                >
                  <Button
                    variant="contained"
                    color="success"
                    disabled={isFetching || resultImageUrl === "/card.png"}
                  >
                    <DownloadIcon />
                    画像をダウンロード
                  </Button>
                </a>
                <Button
                  variant="contained"
                  color="info"
                  disabled={isFetching || resultImageUrl === "/card.png"}
                  onClick={async () => {
                    const response = await fetch(resultImageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], "hasunosora_jimaku.png", { type: "image/png" });
                    navigator
                      .share({
                        text: shareText,
                        files: [file],
                      })
                      .then(() => {
                        console.log("Share was successful.");
                      })
                      .catch((error) => {
                        console.log("Sharing failed", error);
                      });
                  }}
                >
                  <IosShareIcon />
                  画像を共有
                </Button>
              </div>
            </div>
          </Card>
        </div>
        <Card
          sx={{
            minWidth: 275,
            maxWidth: 600,
            maxHeight: "6em",
            borderRadius: 5,
          }}
        >
          <p className={styles["description"]}>使用フォント: Klee One</p>
        </Card>
      </div>
      <div className={styles["footer-container"]}>
        <Footer themeName={themeName} />
      </div>
    </>
  );
}
