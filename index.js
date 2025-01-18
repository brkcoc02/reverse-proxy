const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Health check endpoint
app.get('/ping', (req, res) => {
  console.log('Ping received');
  res.status(200).send('Service is operational');
});

//Retrieve target URL and port from environment variables
const target = process.env.TARGET_URL;
const PORT = process.env.PORT || 10000; // Default to 10000 if PORT is not set

if(!target){
  console.error('Error: TARGET_URL environment variable is not set.');
  process.exit(1);
}

app.use('/', createProxyMiddleware({
  target: target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Host', new URL(target).host);
  }
}));

app.listen(PORT, () => {
  console.log(`Reverse proxy listening on port ${PORT}`);
});
