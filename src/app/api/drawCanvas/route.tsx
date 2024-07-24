/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import fs from "fs"
import path from "path"

import React from "react";

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { loadGoogleFont } from "../../../lib/font";

import { queryType, offsetType } from "../../../types";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    const queryData: queryType = requestBody.queryData;
    const baseImageBase64: string = requestBody.baseImageBase64;

    const quote = queryData.quote;
    const name = queryData.name;

    // まずは、フォントをローカル優先で読み込む
    // memo: vercelだとfsで書き込めないからあらかじめ選択肢を用意する必要がある
    let fontArrayBuffer: ArrayBuffer;

    // ttfまたはotfにしたいからdatに戻すかも

    const fontArrayBuffer1Path = path.join(process.cwd(), "src/assets/fonts/KleeOne-Regular.dat");
    try {
      const result = fs.readFileSync(fontArrayBuffer1Path);
      fontArrayBuffer = result.buffer;
    } catch (error: any) {
      console.error("Error:", error);
      fontArrayBuffer = await loadGoogleFont({
        family: "Klee One",
        weight: 400,
      });
    }

    // 保存するときはこれ使う

    // const fontArrayBuffer3 = await loadGoogleFont({
    //   family: "Cherry Bomb One",
    //   weight: 400,
    // });

    // ./card.pngをarrayBufferに変換して読み込む
    // const cardImagePath = path.join(process.cwd(), "public/card.png");
    // const cardImageArrayBuffer = fs.readFileSync(cardImagePath).buffer;

    // memo: 普通のJSXと違って、1つのdivに{}は1つだけ
    // satoriのドキュメントより、srcはarrayBufferを渡す。<-いや、base64でも出来る
    /**
     * z-indexはない
    */

    //   textShadow: `
    //   ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
    //     [...Array(8)].map((_, i) => {
    //       const angle = i * (Math.PI / 4);
    //       const x = (Math.cos(angle) * size).toFixed(2);
    //       const y = (Math.sin(angle) * size).toFixed(2);
    //       return `${x}px ${y}px 0 #121311`;
    //     }).join(", ")
    //   ).join(", ")}
    // `,

    if (!quote.includes("\n")) {
      return new ImageResponse(
        (<>
          {/* @ts-ignore */}
          <img src={baseImageBase64} width={1920} height={1080} />
          <div
            style={{
              position: "absolute",
              top: "83%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Klee One",
                fontSize: "52px",
                color: "#dbdbdb",
                textShadow: `
          ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
                  [...Array(16)].map((_, i) => {
                    const angle = i * (Math.PI / 8);
                    const x = (Math.cos(angle) * size).toFixed(2);
                    const y = (Math.sin(angle) * size).toFixed(2);
                    return `${x}px ${y}px 0 #121311`;
                  }).join(", ")
                ).join(", ")}
        `,
                textAlign: "center",
                textWrap: "wrap",
                overflowWrap: "break-word",
                lineHeight: "0.9",
                letterSpacing: "0.2px",
                position: "relative",
                left: "2.5px",
              }}
            >
              {quote}
            </div>
          </div>
          <div
            style={{
              fontFamily: "Klee One",
              fontSize: "38px",
              position: "absolute",
              color: "#dbdbdb",
              textShadow: `
              ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
                [...Array(16)].map((_, i) => {
                  const angle = i * (Math.PI / 8);
                  const x = (Math.cos(angle) * size).toFixed(2);
                  const y = (Math.sin(angle) * size).toFixed(2);
                  return `${x}px ${y}px 0 #121311`;
                }).join(", ")
              ).join(", ")}
            `,
              top: "91.5%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            {`[${name}]`}
          </div>
        </>),
        {
          width: 1920,
          height: 1080,
          fonts: [
            {
              name: "Klee One",
              data: fontArrayBuffer,
              style: "normal",
              weight: 400,
            },
          ]
        }
      );
    } else {
      // 改行で、無理やり2行にする
      const line1: string = quote.split("\n")[0];
      const line2: string = quote.split("\n")[1];

      return new ImageResponse(
        (<>
          {/* @ts-ignore */}
          <img src={baseImageBase64} width={1920} height={1080} />
          <div
            style={{
              position: "absolute",
              top: "77%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Klee One",
                fontSize: "52px",
                color: "#dbdbdb",
                textShadow: `
          ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
                  [...Array(16)].map((_, i) => {
                    const angle = i * (Math.PI / 8);
                    const x = (Math.cos(angle) * size).toFixed(2);
                    const y = (Math.sin(angle) * size).toFixed(2);
                    return `${x}px ${y}px 0 #121311`;
                  }).join(", ")
                ).join(", ")}
        `,
                textAlign: "center",
                lineHeight: "0.9",
                letterSpacing: "0.4px",
                position: "relative",
                left: "5px",
              }}
            >
              {line1}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: "83%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Klee One",
                fontSize: "52px",
                color: "#dbdbdb",
                textShadow: `
          ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
                  [...Array(16)].map((_, i) => {
                    const angle = i * (Math.PI / 8);
                    const x = (Math.cos(angle) * size).toFixed(2);
                    const y = (Math.sin(angle) * size).toFixed(2);
                    return `${x}px ${y}px 0 #121311`;
                  }).join(", ")
                ).join(", ")}
        `,
                textAlign: "center",
                lineHeight: "0.9",
                letterSpacing: "0.4px",
                position: "relative",
                left: "5px",
              }}
            >
              {line2}
            </div>
          </div>
          <div
            style={{
              fontFamily: "Klee One",
              fontSize: "38px",
              position: "absolute",
              color: "#dbdbdb",
              textShadow: `
              ${[3, 2.5, 2, 1.5, 1, 0.5].map(size =>
                [...Array(16)].map((_, i) => {
                  const angle = i * (Math.PI / 8);
                  const x = (Math.cos(angle) * size).toFixed(2);
                  const y = (Math.sin(angle) * size).toFixed(2);
                  return `${x}px ${y}px 0 #121311`;
                }).join(", ")
              ).join(", ")}
            `,
              top: "91.5%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            {`[${name}]`}
          </div>
        </>),
        {
          width: 1920,
          height: 1080,
          fonts: [
            {
              name: "Klee One",
              data: fontArrayBuffer,
              style: "normal",
              weight: 400,
            },
          ]
        }
      );
    }

  }
  catch (error: any) {
    console.error("Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}