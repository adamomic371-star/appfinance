require('http').createServer((q, r) => {
  var p = '.' + q.url.replace(/[?].*/, '').replace(/\/$/, '/index.html');
  require('fs').readFile(p, (e, d) => {
    if (e) { r.writeHead(404); r.end('not found'); return; }
    var t = 'text/html';
    if (/\.css$/.test(p)) t = 'text/css';
    else if (/\.js$/.test(p)) t = 'application/javascript';
    else if (/\.svg$/.test(p)) t = 'image/svg+xml';
    else if (/\.json$/.test(p)) t = 'application/json';
    r.writeHead(200, { 'Content-Type': t });
    r.end(d);
  });
}).listen(8080, () => console.log('Server on :8080'));
