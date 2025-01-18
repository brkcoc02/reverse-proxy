const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Health check endpoint
app.get('/ping', (req, res) => {
  console.log('Ping received');
  res.status(200).send('Service is operational');
});

const target = process.env.TARGET_URL;

app.use('/', createProxyMiddleware({
  target: target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Host', new URL(target).host);
  }
}));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Reverse proxy listening on port ${PORT}`);
});
