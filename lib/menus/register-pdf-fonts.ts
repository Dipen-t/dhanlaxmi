import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

const FONT_CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

export function registerPdfFonts() {
  if (fontsRegistered) {
    return;
  }

  Font.register({
    family: "Playball",
    src: `${FONT_CDN}/playball@latest/latin-400-normal.ttf`,
  });

  Font.register({
    family: "Cormorant",
    fonts: [
      {
        src: `${FONT_CDN}/cormorant-garamond@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/cormorant-garamond@latest/latin-600-normal.ttf`,
        fontWeight: 600,
      },
      {
        src: `${FONT_CDN}/cormorant-garamond@latest/latin-400-italic.ttf`,
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "SourceSans",
    fonts: [
      {
        src: `${FONT_CDN}/source-sans-3@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/source-sans-3@latest/latin-600-normal.ttf`,
        fontWeight: 600,
      },
    ],
  });

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: `${FONT_CDN}/inter@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/inter@latest/latin-600-normal.ttf`,
        fontWeight: 600,
      },
    ],
  });

  Font.register({
    family: "Playfair Display",
    fonts: [
      {
        src: `${FONT_CDN}/playfair-display@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/playfair-display@latest/latin-600-normal.ttf`,
        fontWeight: 600,
      },
    ],
  });

  Font.register({
    family: "EB Garamond",
    fonts: [
      {
        src: `${FONT_CDN}/eb-garamond@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/eb-garamond@latest/latin-500-normal.ttf`,
        fontWeight: 500,
      },
      {
        src: `${FONT_CDN}/eb-garamond@latest/latin-400-italic.ttf`,
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Poppins",
    fonts: [
      {
        src: `${FONT_CDN}/poppins@latest/latin-400-normal.ttf`,
        fontWeight: 400,
      },
      {
        src: `${FONT_CDN}/poppins@latest/latin-500-normal.ttf`,
        fontWeight: 500,
      },
      {
        src: `${FONT_CDN}/poppins@latest/latin-600-normal.ttf`,
        fontWeight: 600,
      },
      {
        src: `${FONT_CDN}/poppins@latest/latin-700-normal.ttf`,
        fontWeight: 700,
      },
    ],
  });

  fontsRegistered = true;
}
