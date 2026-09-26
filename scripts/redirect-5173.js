import http from 'http';

const server = http.createServer((req, res) => {
  const targetUrl = `http://localhost:3000${req.url || '/'}`;
  res.writeHead(302, { Location: targetUrl });
  res.end(`Redirecting to ${targetUrl}`);
});

server.listen(5173, '0.0.0.0', () => {
  console.log('[Axiocruit] Redirect bridge active: http://localhost:5173 -> http://localhost:3000');
});
