import { cp, mkdir, rm } from 'node:fs/promises';

const files = ['index.html', 'app.js', 'styles.css', 'enhancements.css'];
await rm('_site', { recursive: true, force: true });
await mkdir('_site/data', { recursive: true });
for (const file of files) await cp(file, `_site/${file}`);
await cp('data/photos.js', '_site/data/photos.js');
await cp('data/quiz.js', '_site/data/quiz.js');
await cp('data/agenda.js', '_site/data/agenda.js');
await cp('public', '_site', { recursive: true });
console.log('Preparada la web estática en _site.');
