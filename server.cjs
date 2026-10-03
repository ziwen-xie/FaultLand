// Optional local preview. The game also opens directly from index.html.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const lan = process.argv.includes('--lan');
const port = Number(process.env.PORT || (lan ? 4174 : 4173));
const allowed = new Set(['/index.html', '/engine.js', '/app.js', '/icons.js', '/styles.css', '/mobile.css', '/assets/scene.png', '/assets/survivor.png', '/assets/mutant.png', '/assets/items.png']);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!['GET', 'HEAD'].includes(req.method) || !allowed.has(file)) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(root, file), (error, body) => {
    if (error) { res.writeHead(500); res.end('Unable to read game file'); return; }
    const mime = types[path.extname(file)];
    res.writeHead(200, { 'Content-Type': mime + (mime.startsWith('text/') ? '; charset=utf-8' : ''), 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}).listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`我在末世捡垃圾：http://127.0.0.1:${port}`);
  if (lan) {
    const interfaces = Object.values(require('node:os').networkInterfaces()).flat();
    for (const network of interfaces) {
      if (network.family === 'IPv4' && !network.internal) console.log(`同一 Wi-Fi 手机访问：http://${network.address}:${port}`);
    }
  }
});
