/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import GlobalStyle from "../../lib/GlobalStyle";
import "@fontsource/klee-one/400.css";

import React from "react";
import { useEffect, useState } from "react";
import { Input, Button, Switch, FormControlLabel } from "@mui/material";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DownloadIcon from "@mui/icons-material/Download";
import IosShareIcon from "@mui/icons-material/IosShare";

import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

import "react-image-crop/dist/ReactCrop.css"

import { queryType, offsetType } from "../../types";

import styles from "./style.module.scss";
import clsx from "clsx";

// import { SelectPicture } from "@/components/SelectPicture";
import CropApp from "../../components/crop/App";

import ImageCanvas from "../../components/imageCanvas/ImageCanvas";

// import CustomToggle from "../../components/customToggle/CustomToggle";

// import CollapseComponent from "@/components/collapse/Collapse";

export default function Page() {
  const [queryData, setQueryData] = useState<queryType>({
    "quote": "",
    "name": "",
    "baseImageBase64": "",
  });

  // const [offsetData, setOffsetData] = useState<offsetType>({
  //   "x": 0,
  //   "y": 0,
  //   "spacing": 0,
  //   "size": 0,
  // })

  const [baseImageBase64, setBaseImageBase64] = useState<string>("");

  const [resultImageUrl, setResultImageUrl] = useState<string>("/card.png");

  // const [fontName, setFontName] = useState<string>(fontList[0]);

  const [isFetching, setIsFetching] = useState<boolean>(false);

  const [isRenderLocal, setIsRenderLocal] = useState<boolean>(true);

  const fetchData = async () => {
    setIsFetching(true);
    const response = await fetch("/api/drawCanvas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryData: queryData,
        baseImageBase64: baseImageBase64,
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch image data");
      setIsFetching(false);
      return;
    }

    if (resultImageUrl) {
      URL.revokeObjectURL(resultImageUrl);
    }
    // return new ImageResponseでかえってくるからblobで受け取る
    // createObjectURLはdocumentないで生成されるから寿命の問題はない
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setResultImageUrl(url);
    setIsFetching(false);
  }

  const [themeColors, setThemeColors] = useState<string[]>(["", ""]);
  const [themeName, setThemeName] = useState<string>("");

  const changeThemeColor = () => {
    const hasuColors1: string[] = ["#FCE8B2", "#CBD9ED", "#D1EBDC", "#EABDC2", "#F7CFE1", "#EEECED", "#E3F3F4", "#FDF3D0", "#E1DCF6",];
    const hasuColors2: string[] = ["#F8B500", "#5383C3", "#68BE8D", "#BA2636	", "#E7609E", "#C8C2C6", "#A2D7DD", "#FAD764", "#9D8DE2"];
    const hasuNames: string[] = ["花帆", "さやか", "梢", "綴理", "瑠璃乃", "慈", "吟子", "小鈴", "姫芽"];

    const randomIndex = Math.floor(Math.random() * hasuColors1.length);
    const randomColor1: string = hasuColors1[randomIndex];
    const randomColor2: string = hasuColors2[randomIndex];
    setThemeColors([randomColor1, randomColor2]);
    setThemeName(hasuNames[randomIndex]);
  }

  useEffect(() => {
    changeThemeColor();
  }, []);

  return (
    <>
      <GlobalStyle />
      <Header
        themeColor={themeColors[1]}
        changeThemeColor={changeThemeColor}
      />
      <div
        className={styles["root"]}
        style={{
          background: `linear-gradient(135deg, ${themeColors[0]}, ${themeColors[1]})`
        }}
      >
        <Card sx={{
          minWidth: 275,
          maxWidth: 600,
          maxHeight: "6em",
          borderRadius: 5,
        }}>
          <p
            className={styles["description"]}
          >
            活動記録の字幕風の画像を生成します。
          </p>
        </Card>
        <div className={styles["workspace-container"]}
        >
          <Card sx={{
            minWidth: 275,
            maxWidth: 600,
            maxHeight: 410,
            borderRadius: 5,
          }}>
            <div
              className={styles["card-title"]}
            >
              1.画像を選択
            </div>
            <CropApp
              setBaseImageBase64={setBaseImageBase64}
            />
          </Card>
          <Card sx={{
            minWidth: 300,
            maxWidth: 1000,
            borderRadius: 5,
          }}>
            <div
              className={styles["card-title"]}
            >
              2.情報を入力
            </div>
            <div
              className={styles["input-container"]}
            >
              <CardContent>
                <div className={styles["select-container"]}
                >
                  <span>セリフ:</span>
                  <Input
                    multiline
                    type="text"
                    placeholder="セリフを入力"
                    value={queryData.quote}
                    onChange={(e) => {
                      // 改行(\n)は2行まで。
                      if (e.target.value.split("\n").length > 2) {
                        return;
                      }
                      const newQueryData = { ...queryData, "quote": e.target.value };
                      setQueryData(newQueryData);
                      setQueryData(oldQueryData => {
                        return oldQueryData;
                      });
                    }}
                    sx={{
                      fontFamily: "'Klee One'!important",
                      fontWeight: "400!important",
                    }}
                  />
                </div>
                <br />
                <div className={styles["select-container"]}
                >
                  <span>名前:</span>
                  <Input
                    type="text"
                    placeholder="名前を入力"
                    value={queryData.name}
                    onChange={(e) => {
                      // const newQueryData = { ...queryData, "name": e.target.value };
                      // setQueryData(newQueryData);
                      setQueryData(oldQueryData => {
                        return { ...oldQueryData, "name": e.target.value };
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
                {
                  baseImageBase64 === "" && (
                    <p>まず、画像を選択してください。</p>
                  )
                }
              </CardContent>
              <CardActions>
                <div className={styles["button-container"]}>
                  <div className={styles["select-container-row1"]}>
                    <span className={styles["local-rendering-label"]}>
                      ローカルでレンダリング(問題がある場合はOffにしてください。)
                    </span>
                    {/* <CustomToggle name="ローカルでレンダリングするかを切り替えるボタン" disabled={isFetching}
                      label={isRenderLocal ? "On" : "Off"} checked={isRenderLocal} onChange={() => setIsRenderLocal(c => !c)} /> */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isRenderLocal}
                          onChange={() => setIsRenderLocal(c => !c)}
                          name="ローカルでレンダリングするかを切り替えるボタン"
                          color="primary"
                          disabled={isFetching}
                        />
                      }
                      label={isRenderLocal ? "On" : "Off"}
                    // sx={{
                    //   fontFamily: ""Klee One"!important",
                    //   fontWeight: "400!important",
                    // }}
                    />
                  </div>
                  <div className={styles["select-container-row2"]}>
                    {!isRenderLocal && (
                      <Button
                        onClick={() => fetchData()}
                        disabled={baseImageBase64 === "" || isFetching}
                        variant="contained"
                        size="large"
                        className={styles["generate-button"]}
                      >
                        <PlayArrowIcon />
                        <p>画像を作成</p>
                      </Button>
                    )}
                    {isFetching ? (
                      <Box sx={{ display: "flex" }} className={styles["loading-icon-container"]}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <div className={styles["loading-icon-container"]}
                      ></div>
                    )}
                  </div>
                </div>
              </CardActions>

            </div>
          </Card>
          <Card sx={{
            minWidth: 275,
            maxWidth: 600,
            maxHeight: 510,
            borderRadius: 5,
          }}>
            <div className={styles["result-container"]}
            >
              <img src={resultImageUrl} alt="Generated Image"
                className={clsx(styles["generated-image"], isFetching && styles["image-dark"])}
              />
              {isRenderLocal && (
                <ImageCanvas baseImageBase64={baseImageBase64} quote={queryData.quote} name={queryData.name}
                  setResultImageUrl={setResultImageUrl}
                  setIsFetching={setIsFetching}
                />
              )}
              <div className={styles["result-button-container"]}
              >
                <a href={isFetching || resultImageUrl === "/card.png" ? undefined : resultImageUrl} download="hasunosora_jimaku.png">
                  <Button variant="contained" color="success"
                    disabled={isFetching || resultImageUrl === "/card.png"}
                  >
                    <DownloadIcon />
                    画像をダウンロード
                  </Button>
                </a>
                <Button variant="contained" color="info"
                  disabled={isFetching || resultImageUrl === "/card.png"}
                  onClick={async () => {
                    const text: string = "活動記録 字幕ジェネレーターで作成した画像です。"
                    const response = await fetch(resultImageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], "hasunosora_jimaku.png", { type: "image/png" });
                    navigator.share({
                      text: decodeURI(text),
                      files: [file]
                    }).then(() => {
                      console.log("Share was successful.");
                    }).catch((error) => {
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
        </div >
        <Card sx={{
          minWidth: 275,
          maxWidth: 600,
          maxHeight: "6em",
          borderRadius: 5,
        }}>
          <p
            className={styles["description"]}
          >
            使用フォント: Klee One
          </p>
        </Card>
      </div>
      <div className={styles["footer-container"]}
      >
        <Footer
          themeName={themeName}
        />
      </div>
    </>
  );
}