const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Health check endpoint
app.get('/ping', (req, res) => {
  console.log('Ping received');
  res.status(200).send('Service is operational');
});

const createProxyConfig = (target) => ({
  target,
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    // Set custom host header
        proxyReq.setHeader('Host', new URL(target).host);
    
    // Remove headers that might expose backend information
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-real-ip');

    // DNS resolution through proxy
    proxyReq.setHeader('Proxy-DNS', 'true');
    },
    onProxyRes: (proxyRes, req, res) => {
    // Remove headers that might expose backend information
        proxyRes.headers['server'] = 'proxy';
        delete proxyRes.headers['x-powered-by'];
        delete proxyRes.headers['via'];
        delete proxyRes.headers['x-runtime'];
        delete proxyRes.headers['x-served-by'];

    // Handle streaming responses
      if (proxyRes.headers['content-type']?.includes('video') ||
          proxyRes.headers['content-type']?.includes('audio')) {
        proxyRes.headers['Cache-Control'] = 'no-cache';
        proxyRes.headers['X-Accel-Buffering'] = 'no';
      }
    },
    pathRewrite: {
      '^/service1': '/', // URL path rewriting for service1
      '^/service2': '/'  // URL path rewriting for service2      
    },
    secure: true, // Verify SSL certificates
    xfwd: false, // Don't add x-forward headers
    followRedirects: true, // Handle redirects
    timeout: 600000, // 10 minute timeout for streams
    proxyTimeout: 600000
}));

const target1 = process.env.TARGET_URL_1;
const target2 = process.env.TARGET_URL_2;
const PORT = process.env.PORT || 10000;

if (!target1 || !target2) {
  console.error('Error: TARGET_URL_1 or TARGET_URL_2 environment variable is not set.');
  process.exit(1);
}

app.use('/service1', createProxyMiddleware(createProxyConfig(target1)));
app.use('/service2', createProxyMiddleware(createProxyConfig(target2)));

// Remove Express fingerprint
app.disable('x-powered-by');

app.listen(PORT, () => {
  console.log(`multi-target reverse proxy listening on port ${PORT}`);
});
