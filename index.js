const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
});

// Handle errors emitted by the transport
transport.on('error', (error) => {
  logger.error(`Logging error: ${error.message}`);
});

// Health check endpoint
app.get('/ping', (req, res) => {
  logger.info('Ping received');
  res.status(200).send('Service is operational');
});

// Retrieve target URL and port from environment variables
const target = process.env.TARGET_URL;
const PORT = process.env.PORT || 10000; // Default to 10000 if PORT is not set

if(!target){
  logger.error('Error: TARGET_URL environment variable is not set.');
  process.exit(1);
}

// Enhanced proxy configuration
app.use('/', createProxyMiddleware({
  target: target,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).send('Proxy encountered an error.');
  },
  onProxyReq: (proxyReq, req, res) => {
    // Set custom host header
        proxyReq.setHeader('Host', new URL(target).host);
        
        // Remove headers that might expose backend information
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-real-ip');
        logger.info(`Proxying request to: ${target}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // Remove headers that might expose backend information
        proxyRes.headers['server'] = 'proxy';
        delete proxyRes.headers['x-powered-by'];
        delete proxyRes.headers['via'];
        delete proxyRes.headers['x-runtime'];
        delete proxyRes.headers['x-served-by'];
        logger.info(`Received response with status: ${proxyRes.statusCode}`);
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
  logger.info(`Reverse proxy listening on port ${PORT}`);
});
