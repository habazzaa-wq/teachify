import { ImageResponse } from "next/og";
import path from "path";
import fs from "fs";

export const alt = "تيتشيفاي — منصتك التعليمية المتكاملة بهويتك";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_DIR = path.join(process.cwd(), "src/features/marketing/assets");

function loadFont(fileName: string): ArrayBuffer | null {
  try {
    const buf = fs.readFileSync(path.join(FONT_DIR, fileName));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const bold = loadFont("Cairo-800.ttf");
  const semibold = loadFont("Cairo-600.ttf");

  const fonts = bold && semibold
    ? [
        { name: "Cairo", data: bold, weight: 800 as const },
        { name: "Cairo", data: semibold, weight: 600 as const },
      ]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: "#FBF6EF",
          position: "relative",
          direction: "rtl",
          fontFamily: "Cairo",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 90,
            background: "rgba(216, 123, 99, 0.16)",
            top: -140,
            right: -110,
            transform: "rotate(18deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            borderRadius: "9999px",
            background: "rgba(255, 181, 14, 0.22)",
            bottom: -150,
            left: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 34,
            background: "#D87B63",
            top: 96,
            left: 96,
            transform: "rotate(-12deg)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 16,
            padding: "12px 26px",
            borderRadius: 9999,
            background: "rgba(216, 123, 99, 0.12)",
            border: "2px solid rgba(216, 123, 99, 0.35)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#FFB50E",
            }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#B05A42",
            }}
          >
            تيتشيفاي · منصة تعليمية متكاملة بهويتك
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#33291F",
          }}
        >
          منصتك التعليمية المتكاملة
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 6,
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.15,
            color: "#B05A42",
          }}
        >
          تنطلق في أيام، لا في أشهر
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 36,
            fontWeight: 600,
            color: "#6B6258",
          }}
        >
          كورسات · امتحانات · طلاب · مدفوعات · شهادات · مجتمع
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 96,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 34,
            fontWeight: 800,
            color: "#33291F",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#FFB50E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              color: "#33291F",
            }}
          >
            ت
          </div>
          teachify.tech
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
