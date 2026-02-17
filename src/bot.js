/**
 * Telegram Bot Logic
 * Handles user interactions, menu, commands, and orchestrates scraping/downloading
 */

const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const Logger = require('./utils/logger');
const FileManager = require('./utils/fileManager');
const strategyEngine = require('./scrapers/strategyEngine');
const JsdomScraper = require('./scrapers/jsdomScraper');
const PuppeteerScraper = require('./scrapers/puppeteerScraper');
const ImageDownloader = require('./downloaders/imageDownloader');
const ZipCreator = require('./downloaders/zipCreator');

// Bot states
const STATE = {
  IDLE: 'idle',
  WAITING_SINGLE_URL: 'waiting_single_url',
  WAITING_MULTI_URL: 'waiting_multi_url',
  PROCESSING: 'processing'
};

// User sessions
const userSessions = new Map();

// Downloads directory
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/app/downloads';
const DOWNLOAD_BASE_URL = process.env.DOWNLOAD_BASE_URL || 'https://gallery.balad.dpdns.org/downloads';

class TelegramBot {
  constructor(token) {
    this.bot = new Telegraf(token, {
      telegram: {
        apiRoot: 'https://api.telegram.org',
        agent: null,
        webhookReply: true
      }
    });
    
    // Increase timeout
    this.bot.telegram.options = {
      ...this.bot.telegram.options,
      timeout: 300000 // 5 minutes
    };
    
    this.setupHandlers();
    this.ensureDownloadsDir();
  }

  /**
   * Ensure downloads directory exists
   */
  ensureDownloadsDir() {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
      Logger.info(`Created downloads directory: ${DOWNLOADS_DIR}`);
    }
  }

  /**
   * Move file to downloads directory and generate download link
   * @param {string} filePath - Source file path
   * @returns {Promise<string>} Download URL
   */
  async moveToDownloads(filePath) {
    try {
      const fileName = path.basename(filePath);
      const destPath = path.join(DOWNLOADS_DIR, fileName);
      
      // Move file
      await fs.promises.rename(filePath, destPath);
      
      // Generate download URL
      const downloadUrl = `${DOWNLOAD_BASE_URL}/${fileName}`;
      
      Logger.info(`File moved to downloads: ${fileName}`);
      return downloadUrl;
    } catch (error) {
      Logger.error('Failed to move file to downloads', { error: error.message });
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in ms
   * @returns {Promise<any>}
   */
  async retryWithBackoff(fn, maxRetries = 5, baseDelay = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        // Check if it's a rate limit error
        const isRateLimitError = error.message && (
          error.message.includes('429') ||
          error.message.includes('Too Many Requests') ||
          error.message.includes('retry after')
        );

        if (!isRateLimitError || attempt === maxRetries) {
          throw error;
        }

        // Extract retry delay from error if available
        let retryDelay = baseDelay * Math.pow(2, attempt);
        const retryMatch = error.message.match(/retry after (\d+)/);
        if (retryMatch) {
          retryDelay = Math.max(retryDelay, parseInt(retryMatch[1]) * 1000);
        }

        Logger.warn(`Rate limit hit, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Get or create user session
   */
  getUserSession(userId) {
    if (!userSessions.has(userId)) {
      userSessions.set(userId, { state: STATE.IDLE });
    }
    return userSessions.get(userId);
  }

  /**
   * Main menu keyboard
   */
  getMainMenu() {
    return Markup.keyboard([
      ['📸 Single Gallery', '📚 Multi Gallery'],
      ['ℹ️ Help', '🔄 Restart']
    ]).resize();
  }

  /**
   * Send download link to user with retry logic
   * @param {Context} ctx - Telegram context
   * @param {string} archivePath - Path to archive file
   * @param {string} caption - Caption text
   */
  async sendDownloadLink(ctx, archivePath, caption) {
    // Get file info first (before moving)
    const stats = fs.statSync(archivePath);
    const fileSize = FileManager.formatBytes(stats.size);
    const fileName = path.basename(archivePath);
    
    // Move to downloads directory
    const downloadUrl = await this.moveToDownloads(archivePath);
    
    // Send message with retry logic
    await this.retryWithBackoff(async () => {
      await ctx.reply(
        `${caption}\n\n` +
        `📦 *File Ready!*\n\n` +
        `📄 Filename: \`${fileName}\`\n` +
        `💾 Size: ${fileSize}\n\n` +
        `🔗 [Click here to download](${downloadUrl})\n\n` +
        `⏱️ Link expires in 24 hours`,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    });
    
    Logger.info(`Download link sent: ${fileName}`);
  }

  /**
   * Setup all bot handlers
   */
  setupHandlers() {
    // Start command
    this.bot.start((ctx) => {
      Logger.info(`User started bot: ${ctx.from.id}`);
      const session = this.getUserSession(ctx.from.id);
      session.state = STATE.IDLE;

      ctx.reply(
        '👋 Welcome to Gallery Downloader Bot!\n\n' +
        'Choose a download mode:\n\n' +
        '📸 *Single Gallery*: Download one gallery\n' +
        '📚 *Multi Gallery*: Download all galleries from a model page\n\n' +
        'Select an option below:',
        { parse_mode: 'Markdown', ...this.getMainMenu() }
      );
    });

    // Help command
    this.bot.command('help', (ctx) => {
      ctx.reply(
        '📚 *How to use this bot:*\n\n' +
        '*Single Gallery Mode:*\n' +
        '1. Click "📸 Single Gallery"\n' +
        '2. Send the gallery URL\n' +
        '3. Wait for download\n' +
        '4. Receive direct download link\n\n' +
        '*Multi Gallery Mode:*\n' +
        '1. Click "📚 Multi Gallery"\n' +
        '2. Send the model page URL\n' +
        '3. Confirm number of galleries\n' +
        '4. Wait for download\n' +
        '5. Receive direct download link\n\n' +
        '*Download Links:*\n' +
        'Files are hosted on our server for 24 hours.\n' +
        'No file size limits!\n\n' +
        '*Supported Sites:*\n' +
        strategyEngine.getSupportedDomains().map(d => `• ${d}`).join('\n'),
        { parse_mode: 'Markdown' }
      );
    });

    // Single Gallery button
    this.bot.hears('📸 Single Gallery', (ctx) => {
      const session = this.getUserSession(ctx.from.id);
      session.state = STATE.WAITING_SINGLE_URL;

      ctx.reply(
        '📸 *Single Gallery Mode*\n\n' +
        'Please send the gallery URL you want to download.\n\n' +
        'Example: https://example.com/gallery/gallery-name',
        { parse_mode: 'Markdown' }
      );
    });

    // Multi Gallery button
    this.bot.hears('📚 Multi Gallery', (ctx) => {
      const session = this.getUserSession(ctx.from.id);
      session.state = STATE.WAITING_MULTI_URL;

      ctx.reply(
        '📚 *Multi Gallery Mode*\n\n' +
        'Please send the model page URL to download all galleries.\n\n' +
        'Example: https://example.com/model/model-name',
        { parse_mode: 'Markdown' }
      );
    });

    // Restart button
    this.bot.hears('🔄 Restart', (ctx) => {
      const session = this.getUserSession(ctx.from.id);
      session.state = STATE.IDLE;
      ctx.reply('✅ Bot restarted! Choose a mode:', this.getMainMenu());
    });

    // Help button
    this.bot.hears('ℹ️ Help', (ctx) => {
      ctx.reply(
        '📚 *How to use this bot:*\n\n' +
        '*Single Gallery Mode:*\n' +
        '1. Click "📸 Single Gallery"\n' +
        '2. Send the gallery URL\n' +
        '3. Wait for download\n' +
        '4. Receive direct download link\n\n' +
        '*Multi Gallery Mode:*\n' +
        '1. Click "📚 Multi Gallery"\n' +
        '2. Send the model page URL\n' +
        '3. Confirm number of galleries\n' +
        '4. Wait for download\n' +
        '5. Receive direct download link',
        { parse_mode: 'Markdown' }
      );
    });

    // URL message handler
    this.bot.on('text', async (ctx) => {
      const session = this.getUserSession(ctx.from.id);
      const url = ctx.message.text;

      // Ignore if not waiting for URL
      if (session.state !== STATE.WAITING_SINGLE_URL && session.state !== STATE.WAITING_MULTI_URL) {
        return;
      }

      // Validate URL
      if (!url.startsWith('http')) {
        ctx.reply('❌ Invalid URL. Please send a valid URL starting with http:// or https://');
        return;
      }

      // Check if site is supported
      if (!strategyEngine.isSupported(url)) {
        const domain = strategyEngine.extractDomain(url);
        ctx.reply(
          `❌ Sorry, ${domain} is not supported yet.\n\n` +
          '*Supported sites:*\n' +
          strategyEngine.getSupportedDomains().map(d => `• ${d}`).join('\n'),
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Process based on mode
      if (session.state === STATE.WAITING_SINGLE_URL) {
        await this.processSingleGallery(ctx, url);
      } else if (session.state === STATE.WAITING_MULTI_URL) {
        await this.processMultiGallery(ctx, url);
      }
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      Logger.error('Bot error', { error: err.message, user: ctx.from?.id });
      ctx.reply('❌ An error occurred. Please try again or use /start to restart.');
      const session = this.getUserSession(ctx.from.id);
      session.state = STATE.IDLE;
    });
  }

  /**
   * Process single gallery download
   */
  async processSingleGallery(ctx, url) {
    const session = this.getUserSession(ctx.from.id);
    session.state = STATE.PROCESSING;

    const statusMsg = await ctx.reply('⏳ Processing... Please wait.');
    let tempDir;
    let archivePath;

    try {
      // Get strategy
      const strategy = strategyEngine.getStrategy(url);
      
      // Extract images
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '🔍 Extracting image URLs...'
      );
      const imageUrls = await JsdomScraper.extractImages(url, strategy);

      if (imageUrls.length === 0) {
        throw new Error('No images found in gallery');
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ Found ${imageUrls.length} images\n📥 Downloading...`
      );

      // Create temp directory
      tempDir = await FileManager.createTempDir('single_gallery');
      const galleryName = JsdomScraper.extractGalleryName(url);

      // Download images
      const downloadResult = await ImageDownloader.downloadImages(
        imageUrls,
        tempDir,
        5,
        (progress) => {
          if (progress.current % 5 === 0 || progress.current === progress.total) {
            ctx.telegram.editMessageText(
              ctx.chat.id,
              statusMsg.message_id,
              null,
              `📥 Downloading: ${progress.current}/${progress.total}\n` +
              `✅ Success: ${progress.success} | ❌ Failed: ${progress.failed}`
            ).catch(() => {});
          }
        }
      );

      if (downloadResult.success === 0) {
        throw new Error('Failed to download any images');
      }

      // Create 7z archive
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📦 Creating archive...'
      );
      archivePath = await ZipCreator.createSingleGalleryZip(tempDir, galleryName);

      // Send download link
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '🔗 Generating download link...'
      );

      const caption =
        `✅ *Download Complete!*\n\n` +
        `📋 Gallery: ${galleryName}\n` +
        `📷 Images: ${downloadResult.success}/${downloadResult.total}`;

      await this.sendDownloadLink(ctx, archivePath, caption);
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

      // Cleanup temp directory
      await FileManager.deleteDir(tempDir);

      session.state = STATE.IDLE;
      await this.retryWithBackoff(async () => {
        await ctx.reply('Ready for next download!', this.getMainMenu());
      });

    } catch (error) {
      Logger.error('Single gallery processing failed', { error: error.message, url });
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ Error: ${error.message}\n\nPlease try again.`
      );

      if (tempDir) await FileManager.deleteDir(tempDir);
      if (archivePath) await FileManager.deleteFile(archivePath).catch(() => {});

      session.state = STATE.IDLE;
    }
  }

  /**
   * Process multi-gallery download
   */
  async processMultiGallery(ctx, url) {
    const session = this.getUserSession(ctx.from.id);
    session.state = STATE.PROCESSING;

    const statusMsg = await ctx.reply('⏳ Processing... This may take a while.');
    let tempDir;
    let archivePath;

    try {
      // Get strategy
      const strategy = strategyEngine.getStrategy(url);

      // Extract gallery links
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '🌐 Opening page and extracting galleries...\nThis may take 1-2 minutes.'
      );
      const galleryLinks = await PuppeteerScraper.extractGalleryLinks(url, strategy);

      if (galleryLinks.length === 0) {
        throw new Error('No galleries found on this page');
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ Found ${galleryLinks.length} galleries!\n\n🔍 Extracting images from each gallery...`
      );

      // Extract images from each gallery
      const galleries = [];
      for (let i = 0; i < galleryLinks.length; i++) {
        const galleryUrl = galleryLinks[i];
        const galleryName = JsdomScraper.extractGalleryName(galleryUrl);

        try {
          const imageUrls = await JsdomScraper.extractImages(galleryUrl, strategy);
          galleries.push({ name: galleryName, urls: imageUrls });

          if ((i + 1) % 5 === 0 || i === galleryLinks.length - 1) {
            await ctx.telegram.editMessageText(
              ctx.chat.id,
              statusMsg.message_id,
              null,
              `🔍 Extracting images: ${i + 1}/${galleryLinks.length} galleries processed`
            ).catch(() => {});
          }
        } catch (error) {
          Logger.warn(`Failed to extract gallery: ${galleryUrl}`, { error: error.message });
        }
      }

      const totalImages = galleries.reduce((sum, g) => sum + g.urls.length, 0);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ Extraction complete!\n\n` +
        `📋 Galleries: ${galleries.length}\n` +
        `📷 Total Images: ${totalImages}\n\n` +
        `📥 Starting download...`
      );

      // Create temp directory
      tempDir = await FileManager.createTempDir('multi_gallery');
      const modelName = strategyEngine.extractDomain(url).split('.')[0];

      // Download all galleries
      await ImageDownloader.downloadMultipleGalleries(
        galleries,
        tempDir,
        (progress) => {
          ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `📥 Downloading gallery: ${progress.completedGalleries + 1}/${progress.totalGalleries}\n` +
            `📋 Current: ${progress.galleryName}\n` +
            `📷 Progress: ${progress.galleryProgress.current}/${progress.galleryProgress.total}`
          ).catch(() => {});
        }
      );

      // Create 7z archive
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📦 Creating archive... (This may take a few minutes)'
      );
      archivePath = await ZipCreator.createMultiGalleryZip(tempDir, modelName);

      // Send download link
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '🔗 Generating download link...'
      );

      const caption =
        `✅ *Multi-Gallery Download Complete!*\n\n` +
        `📋 Galleries: ${galleries.length}\n` +
        `📷 Total Images: ${totalImages}`;

      await this.sendDownloadLink(ctx, archivePath, caption);
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

      // Cleanup temp directory
      await FileManager.deleteDir(tempDir);

      session.state = STATE.IDLE;
      await this.retryWithBackoff(async () => {
        await ctx.reply('Ready for next download!', this.getMainMenu());
      });

    } catch (error) {
      Logger.error('Multi-gallery processing failed', { error: error.message, url });
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ Error: ${error.message}\n\nPlease try again.`
      );

      if (tempDir) await FileManager.deleteDir(tempDir);
      if (archivePath) await FileManager.deleteFile(archivePath).catch(() => {});

      session.state = STATE.IDLE;
    }
  }

  /**
   * Initialize bot
   */
  async initialize() {
    try {
      await strategyEngine.loadStrategies();
      Logger.info('Bot initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Start bot with webhook
   */
  async startWebhook(webhookDomain, path, port) {
    await this.initialize();
    await this.bot.telegram.setWebhook(`${webhookDomain}${path}`);
    Logger.info(`Webhook set: ${webhookDomain}${path}`);
    return this.bot;
  }

  /**
   * Start bot with polling
   */
  async startPolling() {
    await this.initialize();
    await this.bot.launch();
    Logger.info('Bot started with polling');
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

module.exports = TelegramBot;
