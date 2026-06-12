/**
 * PWA Icon Generation Script
 * Generates PWA icons from public/file.svg using sharp.
 * Called during prebuild: `npm run prebuild`
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = join(__dirname, '..', 'public', 'file.svg');
const outputDir = join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);
    console.log(`Generating ${size}x${size}...`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
  }
  console.log('PWA icons generated successfully.');
}

generateIcons().catch((err) => {
  console.error('PWA icon generation failed:', err);
  process.exit(1);
});
