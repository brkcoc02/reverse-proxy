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

// Enhanced proxy configuration
app.use('/', createProxyMiddleware({
  target: target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Set custom host header
        proxyReq.setHeader('Host', new URL(target).host);
        
        // Remove headers that might expose backend information
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-real-ip');
    },
    onProxyRes: (proxyRes, req, res) => {
        // Remove headers that might expose backend information
        proxyRes.headers['server'] = 'proxy';
        delete proxyRes.headers['x-powered-by'];
        delete proxyRes.headers['via'];
        delete proxyRes.headers['x-runtime'];
        delete proxyRes.headers['x-served-by'];
    },
    pathRewrite: {
        '^/': '/' // URL path rewriting
    },
    secure: true, // Verify SSL certificates
    xfwd: false, // Don't add x-forward headers
}));

// Remove Express fingerprint
app.disable('x-powered-by');

app.listen(PORT, () => {
  console.log(`Reverse proxy listening on port ${PORT}`);
});
