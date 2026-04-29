'use strict';

const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 8080;
const VERSION = process.env.APP_VERSION || 'dev';

const routes = {
  '/': () => ({
    message: 'ECS Fargate Demo — running',
    version: VERSION,
    hostname: os.hostname(),
  }),
  '/api/health': () => ({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
  '/api/info': () => ({
    version: VERSION,
    hostname: os.hostname(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  }),
};

const server = http.createServer((req, res) => {
  const handler = routes[req.url];
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: req.url }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(handler()));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} — version ${VERSION}`);
});
