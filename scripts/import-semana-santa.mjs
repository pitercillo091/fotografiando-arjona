import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(root, 'SEMANA SANTA');
const outputDirectory = path.join(root, 'public', 'images', 'semana-santa');
const dataPath = path.join(root, 'data', 'semana-santa.js');
const validImage = /\.(jpe?g|png|webp|avif)$/i;
const sourceFiles = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && validImage.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'es'));

await mkdir(outputDirectory, { recursive: true });

const photos = [];
const seenHashes = new Map();
const duplicates = [];

for (const filename of sourceFiles) {
  const sourcePath = path.join(sourceDirectory, filename);
  const bytes = await readFile(sourcePath);
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  if (seenHashes.has(hash)) {
    duplicates.push({ original: seenHashes.get(hash), duplicate: filename });
    continue;
  }
  seenHashes.set(hash, filename);

  const extension = path.extname(filename).toLowerCase();
  const outputName = hash + extension;
  const fullOutput = path.join(outputDirectory, outputName);
  const thumbnailName = hash + '-640.jpg';
  const thumbnailOutput = path.join(outputDirectory, thumbnailName);
  const [width, height] = execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0',
    sourcePath
  ], { encoding: 'utf8' }).trim().split(',').map(Number);

  await copyFile(sourcePath, fullOutput);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-i', sourcePath,
    '-vf', 'scale=w=min(640\\,iw):h=-2',
    '-frames:v', '1',
    '-q:v', '3',
    thumbnailOutput
  ], { stdio: 'ignore' });

  const number = photos.length + 1;
  const label = String(number).padStart(2, '0');
  photos.push({
    id: 'semana-santa-' + hash,
    src: 'images/semana-santa/' + outputName,
    thumbnailSrc: 'images/semana-santa/' + thumbnailName,
    width,
    height,
    bytes: (await stat(sourcePath)).size,
    originalName: filename,
    title: 'Semana Santa · Fotografía ' + label,
    alt: 'Fotografía de Semana Santa en Arjona, Jaén. Motivo concreto pendiente de revisión; imagen ' + label + '.',
    photographer: 'Juan Martínez Gómez'
  });
}

const moduleContents = [
  '// Generado automáticamente desde SEMANA SANTA por scripts/import-semana-santa.mjs.',
  'export const semanaSantaPhotos = ' + JSON.stringify(photos, null, 2) + ';'
].join(String.fromCharCode(10)) + String.fromCharCode(10);
await writeFile(dataPath, moduleContents, 'utf8');

console.log(JSON.stringify({
  sourcePhotos: sourceFiles.length,
  galleryPhotos: photos.length,
  exactDuplicates: duplicates,
  dataPath: path.relative(root, dataPath)
}, null, 2));
