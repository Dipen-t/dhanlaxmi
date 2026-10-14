// Run on a development machine; Termux only reads these prepared assets.
const fs = require('node:fs/promises');
const sharp = require('sharp');
const catalog = require('../lib/menus/category-image-catalog.json');

async function main() {
  await fs.mkdir('public/menu-category-images/pdf', { recursive: true });
  for (const category of catalog) {
    // 450px at the largest 148pt photo size gives about 219dpi.
    // Preserve alpha; never flatten food cutouts onto a background.
    await sharp(`public/menu-category-images/${category.key}.png`)
      .resize({ width: 450, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(`public/menu-category-images/pdf/${category.key}.png`);
  }
  for (const theme of ['ivory-botanical', 'burgundy-gold', 'emerald-gold', 'art-deco-gold']) {
    const folder = `public/menu-themes/${theme}`;
    const cover = theme === 'art-deco-gold' ? 'background-v2.png' : 'background-v1.png';
    // Backgrounds are opaque artwork; JPEG avoids embedding huge PNG rasters.
    await sharp(`${folder}/${cover}`).jpeg({ quality: 88, mozjpeg: true }).toFile(`${folder}/background-pdf.jpg`);
    await sharp(`${folder}/background-content-v1.png`).jpeg({ quality: 88, mozjpeg: true }).toFile(`${folder}/background-content-pdf.jpg`);
  }
  console.log('Prepared 20 transparent print PNGs and 8 compressed background JPEGs.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
