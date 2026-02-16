/**
 * Application Entry Point
 * Express server with webhook endpoint for Telegram bot
 */

require('dotenv').config();
const express = require('express');
const TelegramBot = require('./bot');
const Logger = require('./utils/logger');
const FileManager = require('./utils/fileManager');

// Configuration
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate environment
if (!BOT_TOKEN) {
  Logger.error('BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

if (NODE_ENV === 'production' && !WEBHOOK_URL) {
  Logger.error('WEBHOOK_URL is required in production mode');
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Telegram Gallery Bot',
    version: '1.0.0',
    status: 'running'
  });
});

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN);

// Start server based on environment
if (NODE_ENV === 'production') {
  // Production: Use webhook
  const webhookPath = `/webhook/${BOT_TOKEN}`;

  bot.startWebhook(WEBHOOK_URL, webhookPath, PORT)
    .then((botInstance) => {
      // Setup webhook endpoint
      app.use(botInstance.webhookCallback(webhookPath));

      // Start Express server
      app.listen(PORT, () => {
        Logger.info(`Server started in PRODUCTION mode on port ${PORT}`);
        Logger.info(`Webhook URL: ${WEBHOOK_URL}${webhookPath}`);

        // Schedule cleanup of old temp files
        setInterval(() => {
          FileManager.cleanupOldTempDirs();
        }, 60 * 60 * 1000); // Every hour
      });
    })
    .catch((error) => {
      Logger.error('Failed to start bot with webhook', { error: error.message });
      process.exit(1);
    });

} else {
  // Development: Use polling
  bot.startPolling()
    .then(() => {
      Logger.info('Bot started in DEVELOPMENT mode with polling');
      
      // Start Express for health check
      app.listen(PORT, () => {
        Logger.info(`Health check server running on port ${PORT}`);
      });

      // Schedule cleanup
      setInterval(() => {
        FileManager.cleanupOldTempDirs();
      }, 60 * 60 * 1000);
    })
    .catch((error) => {
      Logger.error('Failed to start bot with polling', { error: error.message });
      process.exit(1);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT signal received: closing server');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled rejection', { reason, promise });
});
