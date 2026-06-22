import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, '..', 'public', 'icons', 'source.svg')
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

const svg = await readFile(SOURCE)

for (const size of SIZES) {
  const out = resolve(OUT_DIR, `icon-${size}x${size}.png`)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(out)
  console.log(`generated ${out}`)
}

console.log('done')
