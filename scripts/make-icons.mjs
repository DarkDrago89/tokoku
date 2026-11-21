// Membuat ikon PNG untuk PWA dari public/icons/icon.svg. Jalankan: node scripts/make-icons.mjs
import sharp from "sharp";
const src = "public/icons/icon.svg";
for (const size of [192, 512]) await sharp(src).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
await sharp(src).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
console.log("ikon dibuat");
