import { cp, mkdir, rm } from 'node:fs/promises';

await import('./import-semana-santa.mjs');
await import('./sync-agenda-images.mjs');
const files = ['index.html', 'app.js', 'styles.css', 'enhancements.css'];
await rm('_site', { recursive: true, force: true });
await mkdir('_site/data', { recursive: true });
for (const file of files) await cp(file, `_site/${file}`);
await cp('data/photos.js', '_site/data/photos.js');
await cp('data/quiz.js', '_site/data/quiz.js');
await cp('data/agenda.js', '_site/data/agenda.js');
await cp('data/agenda-images.js', '_site/data/agenda-images.js');
await cp('data/stories.js', '_site/data/stories.js');
await cp('data/andalucia.js', '_site/data/andalucia.js');
await cp('data/semana-santa.js', '_site/data/semana-santa.js');
await cp('public', '_site', { recursive: true });
console.log('Preparada la web estática en _site.');
