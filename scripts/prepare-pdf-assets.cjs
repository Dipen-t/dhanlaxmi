// Development-only: prepare portable assets once, then commit public files.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const fonts = [
  ['playball', ['400-normal']],
  ['cormorant-garamond', ['400-normal', '600-normal', '400-italic']],
  ['source-sans-3', ['400-normal', '600-normal']],
  ['inter', ['400-normal', '600-normal']],
  ['playfair-display', ['400-normal', '600-normal']],
  ['eb-garamond', ['400-normal', '500-normal', '400-italic']],
  ['poppins', ['400-normal', '500-normal', '600-normal', '700-normal']],
];
async function save(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
}
async function main() {
  const directory = path.join(process.cwd(), 'public/fonts/menu');
  await Promise.all(fonts.map(async ([family, variants]) => {
    await Promise.all(variants.map(variant => save(
      `https://cdn.jsdelivr.net/fontsource/fonts/${family}@latest/latin-${variant}.ttf`,
      path.join(directory, `${family}-${variant}.ttf`),
    )));
    await save(`https://cdn.jsdelivr.net/npm/@fontsource/${family}@latest/LICENSE`, path.join(directory, `LICENSE-${family}.txt`));
  }));
  await sharp('app/logo.png').trim().png().toFile('public/menu-themes/logo-ink.png');
  await sharp('app/logo.png').trim().linear([0, 0, 0], [244, 215, 143]).png().toFile('public/menu-themes/logo-gold.png');
  console.log('Bundled 17 PDF fonts, licenses and both cover logos. No runtime network/native processing needed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
