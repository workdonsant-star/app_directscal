import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const reportAsset = (name: string) => path.join(process.cwd(), "src/lib/pdf/assets", name);

Font.register({ family: "ReportBody", fonts: [
  { src: reportAsset("FunnelSans-Regular.ttf"), fontWeight: 400 },
  { src: reportAsset("FunnelSans-Bold.ttf"), fontWeight: 700 },
] });
Font.register({ family: "ReportHeading", src: reportAsset("PlusJakartaSans-Bold.ttf"), fontWeight: 700 });
Font.registerHyphenationCallback((word) => [word]);

// Espelho dos tokens doc-* de globals.css: CSS px × 0,75 = pontos no PDF.
export const reportTypography = {
  title: { fontFamily: "ReportHeading", fontWeight: 700, fontSize: 27, lineHeight: 40 / 36, letterSpacing: -0.675 },
  h2: { fontFamily: "ReportHeading", fontWeight: 700, fontSize: 18, lineHeight: 32 / 24, letterSpacing: -0.36 },
  h3: { fontFamily: "ReportHeading", fontWeight: 700, fontSize: 15, lineHeight: 28 / 20 },
} as const;
