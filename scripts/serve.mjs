import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml'};
createServer(async (request, response) => {
  const requested = decodeURIComponent((request.url || '/').split('?')[0]);
  const relative = requested === '/' ? 'index.html' : requested.startsWith('/images/') ? `public${requested}` : requested.slice(1);
  const safe = normalize(join(root, relative));
  if (!safe.startsWith(normalize(root))) { response.writeHead(403); response.end('Forbidden'); return; }
  try { const body = await readFile(safe); response.writeHead(200, {'Content-Type': types[extname(safe).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache'}); response.end(body); }
  catch { response.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); response.end('Not found'); }
}).listen(port, () => console.log(`Fotografiando Arjona: http://localhost:${port}`));
