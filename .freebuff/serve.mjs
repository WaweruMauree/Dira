import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = '/Users/maureenwaweru/Documents/Dira/frontend/dist';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

createServer((req, res) => {
  try {
    const url = req.url.split('?')[0];
    let p = join(DIST, url === '/' ? 'index.html' : url);
    
    if (!existsSync(p) || statSync(p).isDirectory()) {
      p = join(DIST, 'index.html');
    }
    
    const ext = extname(p);
    const contentType = MIME[ext] || 'application/octet-stream';
    const data = readFileSync(p);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error: ' + err.message);
  }
}).listen(3456, '127.0.0.1', () => {
  console.log('Dira preview server running at http://127.0.0.1:3456');
});
