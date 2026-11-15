import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { agendaEvents } from '../data/agenda.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(root, 'AGENDA');
const outputDirectory = path.join(root, 'public', 'images', 'agenda');
const sourceFiles = await readdir(sourceDirectory, { withFileTypes: true });
const imageFiles = sourceFiles
  .filter((entry) => entry.isFile() && /\.(jpe?g|jfif|png|webp|avif)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'es'));

function normalizeName(value) {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/(?:[_ -](?:\d+|copia))$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slug(value) {
  return normalizeName(value).replace(/\s+/g, '-');
}

function imageOrder(name) {
  const match = name.match(/(?:[_ -](\d+))\.[^.]+$/i);
  return match ? Number(match[1]) : 0;
}

const eventsByName = new Map();
for (const event of agendaEvents) {
  const key = normalizeName(event.title);
  const matches = eventsByName.get(key) || [];
  matches.push(event);
  eventsByName.set(key, matches);
}

const imagesByEvent = new Map();
const ambiguousFiles = [];
const unassignedFiles = [];
const manualReview = [];
const altDescriptions = {
  'Campaña Fidelidad entrega de flores de Pascua.jpeg': 'Primer plano de flores rojas de la fotografía asociada a la Campaña Fidelidad de Arjona.',
  'El Toro de Caña.jpeg': 'Figura de El Toro de Caña, con máscara de tela, cañas y cencerros.',
  'Olivar, cultura y tradición.jpeg': 'Instalación de ramas de olivo en mosaico junto a una mesa de productos y un cartel de degustación.',
  'Patrimonio artístico-religioso de Arjona.jpeg': 'Fachada de piedra de una iglesia con portada arqueada y puertas de madera.',
  'XVII Ruta de la Tapa.jfif': 'Cartel de la Ruta de la Tapa de Arjona con platos ilustrados y lista de establecimientos participantes.'
};
for (const filename of imageFiles) {
  const candidates = eventsByName.get(normalizeName(filename)) || [];
  if (candidates.length === 0) {
    unassignedFiles.push(filename);
    continue;
  }
  if (candidates.length > 1) {
    ambiguousFiles.push({ filename, events: candidates.map((event) => event.title) });
    continue;
  }
  const event = candidates[0];
  const files = imagesByEvent.get(event.id) || [];
  files.push(filename);
  imagesByEvent.set(event.id, files);
}

await mkdir(outputDirectory, { recursive: true });
const assignments = {};
for (const event of agendaEvents) {
  const filenames = (imagesByEvent.get(event.id) || []).sort((a, b) => imageOrder(a) - imageOrder(b) || a.localeCompare(b, 'es'));
  if (!filenames.length) continue;
  const images = [];
  for (const [index, filename] of filenames.entries()) {
    const extension = path.extname(filename).toLowerCase().replace('.jpeg', '.jpg').replace('.jfif', '.jpg');
    const outputName = `${slug(event.title)}${index ? `-${index + 1}` : ''}${extension}`;
    const originalPath = path.join(sourceDirectory, filename);
    await copyFile(originalPath, path.join(outputDirectory, outputName));
    images.push({
      src: `images/agenda/${outputName}`,
      width: null,
      height: null,
      alt: altDescriptions[filename] || `Imagen asociada al evento ${event.title} en Arjona.`,
      credit: filename === 'XVII Ruta de la Tapa.jfif' ? 'Cartel de la Ruta de la Tapa' : 'Juan Martínez Gómez',
      originalName: filename
    });
  }
  assignments[event.id] = images;
  if (event.id === 'arjona-2026-ruta-tapa' && filenames.includes('XVII Ruta de la Tapa.jfif')) {
    manualReview.push('El cartel muestra «XXII Ruta de la Tapa», mientras el título actual de la agenda indica «XVII Ruta de la Tapa». Confirmar el ordinal del evento.');
  }
}

const assignmentModule = `// Generado por scripts/sync-agenda-images.mjs a partir de AGENDA.\nexport const agendaImageAssignments = ${JSON.stringify(assignments, null, 2)};\n`;
await writeFile(path.join(root, 'data', 'agenda-images.js'), assignmentModule, 'utf8');

const unmatchedEvents = agendaEvents.filter((event) => !assignments[event.id]).map((event) => event.title);
const report = [
  '# Revisión de fotografías de Agenda',
  '',
  `Carpeta revisada: \`AGENDA\` · Archivos de imagen: ${imageFiles.length}`,
  '',
  '## Eventos con imagen',
  ...Object.entries(assignments).flatMap(([id, images]) => {
    const title = agendaEvents.find((event) => event.id === id)?.title || id;
    return [`- ${title}: ${images.map((image) => `\`${image.originalName}\``).join(', ')}`];
  }),
  '',
  '## Eventos sin imagen',
  ...(unmatchedEvents.length ? unmatchedEvents.map((title) => `- ${title}`) : ['- Ninguno']),
  '',
  '## Fotografías sin evento',
  ...(unassignedFiles.length ? unassignedFiles.map((name) => `- \`${name}\``) : ['- Ninguna']),
  '',
  '## Coincidencias ambiguas',
  ...(ambiguousFiles.length ? ambiguousFiles.map((item) => `- \`${item.filename}\`: ${item.events.join(', ')}`) : ['- Ninguna']),
  '',
  '## Revisión manual del contenido',
  ...(manualReview.length ? manualReview.map((item) => `- ${item}`) : ['- Ninguna']),
  '',
  'Las coincidencias usan nombres normalizados y exactos. Las imágenes originales se conservan en \`AGENDA\`.'
].join('\n');
await writeFile(path.join(sourceDirectory, 'INFORME-DE-COINCIDENCIAS.md'), `${report}\n`, 'utf8');

console.log(JSON.stringify({
  sourceImages: imageFiles.length,
  assignedEvents: Object.keys(assignments).length,
  unmatchedEvents,
  unassignedFiles,
  ambiguousFiles,
  manualReview
}, null, 2));
