import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'GALERIA DE FOTOS');
const catalogPath = path.join(root, 'data', 'photos.js');
const publicImages = path.join(root, 'public', 'images');
const optimizedImages = path.join(publicImages, 'optimized');
const existing = await readFile(catalogPath, 'utf8');
const known = new Set([...existing.matchAll(/file:'([^']+)'/g)].map((match) => match[1]));
let nextId = Math.max(0, ...[...existing.matchAll(/id:'arjona-(\d+)'/g)].map((match) => Number(match[1]))) + 1;
const files = (await readdir(source)).filter((file) => /\.(jpe?g|jfif|png|webp|avif)$/i.test(file));
const additions = [];

await mkdir(publicImages, {recursive: true});
await mkdir(optimizedImages, {recursive: true});

for (const file of files) {
  const bytes = (await stat(path.join(source, file))).size;
  const hash = createHash('sha256').update(await readFile(path.join(source, file))).digest('hex').slice(0, 16);
  const output = `${hash}.jpeg`;
  if (known.has(output) || known.has(`${hash}.jpg`)) continue;
  const [width, height] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(source, file)], { encoding: 'utf8' }).trim().split(',').map(Number);
  await copyFile(path.join(source, file), path.join(publicImages, output));
  if (width > 800) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(source, file), '-vf', 'scale=640:-2', '-q:v', '3', path.join(optimizedImages, `${hash}-640.jpg`)]);
  const category = width === height ? 'detalles' : width > height ? 'paisaje' : 'patrimonio';
  const categoryLabel = category === 'detalles' ? 'Cuadradas' : category === 'paisaje' ? 'Horizontales' : 'Verticales';
  additions.push(`  {id:'arjona-${nextId}',file:'${output}',width:${width},height:${height},bytes:${bytes},category:'${category}',categoryLabel:'${categoryLabel}',title:'Fotografía ${nextId}'},`);
  nextId += 1;
}

if (additions.length) await writeFile(catalogPath, existing.replace(/\n\];\s*$/, `\n${additions.join('\n')}\n];`), 'utf8');
console.log(`Añadidas ${additions.length} fotografías al catálogo.`);
