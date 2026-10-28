const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
http.createServer((req,res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch {res.writeHead(400).end();return;}
  if (file === root) file = path.join(root,'index.html');
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));

