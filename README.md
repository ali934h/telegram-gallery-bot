# 🤖 Telegram Gallery Bot

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A professional Telegram bot for automated gallery image downloading from various model photography websites. Built with Node.js, Docker, and modern web scraping technologies.

## ✨ Key Features

- 📸 **Single Gallery Mode**: Download all images from a specific gallery
- 📚 **Multi Gallery Mode**: Download all galleries from a model's page
- 🎯 **Strategy Pattern**: Add new sites without changing code
- ⚡ **jsdom**: Fast HTML parsing for image extraction
- 🌐 **Puppeteer**: Lazy-loading support for complex pages
- 📦 **ZIP Output**: All images packaged in compressed archives
- 🐳 **Docker Ready**: Easy deployment and scaling
- 🔒 **SSL Support**: Secure webhook with Cloudflare
- 🔄 **Auto Cleanup**: Automatic temporary file management

## 🏗️ Project Architecture

```
telegram-gallery-bot/
├── src/
│   ├── index.js                    # Express server + Webhook
│   ├── bot.js                      # Telegram bot logic
│   ├── config/
│   │   └── siteStrategies.json    # Site selector configurations
│   ├── scrapers/
│   │   ├── strategyEngine.js      # Strategy management
│   │   ├── jsdomScraper.js        # Fast HTML parsing
│   │   └── puppeteerScraper.js    # Lazy-loading support
│   ├── downloaders/
│   │   ├── imageDownloader.js     # Image downloading
│   │   └── zipCreator.js          # ZIP creation
│   └── utils/
│       ├── fileManager.js         # File management
│       └── logger.js              # Logging utility
├── temp/                           # Temporary files
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .env
```

## 🚀 Installation & Setup

### Prerequisites

- Docker and Docker Compose
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Domain with SSL (optional, for webhook)

### Installation Steps

1. **Clone the repository**:
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
```

2. **Configure environment variables**:
```bash
cp .env.example .env
nano .env  # Edit and add your BOT_TOKEN
```

3. **Run with Docker**:
```bash
docker-compose up -d
```

4. **View logs**:
```bash
docker-compose logs -f bot
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com
PORT=3000
NODE_ENV=production
```

### Adding New Sites

To add support for a new site, simply add an entry to `src/config/siteStrategies.json`:

```json
{
  "example.com": {
    "name": "ExampleSite",
    "galleries": {
      "selector": "a.gallery-link",
      "attr": "href"
    },
    "images": {
      "selector": "img.gallery-image",
      "attr": "src",
      "filterPatterns": ["thumb", "_small"]
    }
  }
}
```

**Fields explanation:**
- `galleries.selector`: CSS selector for gallery links on model pages
- `galleries.attr`: Attribute name to extract URL (usually `href`)
- `images.selector`: CSS selector for image links in galleries
- `images.attr`: Attribute name to extract image URL (`href` or `src`)
- `filterPatterns`: Array of patterns to filter out thumbnails and low-quality images

## 📖 Usage

1. Start the bot in Telegram: `/start`
2. Choose a download mode:
   - 📸 **Single Gallery**: Download one gallery
   - 📚 **Multi Gallery**: Download all galleries from a model page
3. Send the URL
4. Wait for processing and download
5. Receive your ZIP file! 🎉

### Example Workflow

**Single Gallery Mode:**
```
User: Click "📸 Single Gallery"
Bot: "Please send the gallery URL"
User: https://example.com/gallery/gallery-name
Bot: ⏳ Processing...
     🔍 Found 45 images
     📥 Downloading... (45/45)
     📦 Creating ZIP...
     📤 Uploading...
     ✅ Download Complete! [ZIP FILE]
```

**Multi Gallery Mode:**
```
User: Click "📚 Multi Gallery"
Bot: "Please send the model page URL"
User: https://example.com/model/model-name
Bot: ⏳ Processing...
     🌐 Extracting galleries...
     ✅ Found 12 galleries!
     📥 Downloading gallery 1/12...
     ...
     📦 Creating ZIP...
     ✅ Multi-Gallery Download Complete! [ZIP FILE]
```

## 🐳 Docker Deployment

### Development Mode
```bash
docker-compose up
```

### Production Mode
```bash
docker-compose up -d
```

### Stop and Remove
```bash
docker-compose down
```

### Rebuild After Changes
```bash
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Bot only
docker-compose logs -f bot

# Nginx only
docker-compose logs -f nginx
```

## 🌐 Production Setup

### With DigitalOcean + Cloudflare

1. **Create a Droplet** with Docker Marketplace Image (Ubuntu 22.04/24.04)
2. **Configure DNS** in Cloudflare (A Record pointing to your Droplet IP)
3. **Get Origin Certificate** from Cloudflare SSL/TLS settings
4. **Place certificates** in `ssl/` directory:
   - `ssl/cert.pem` (Cloudflare Origin Certificate)
   - `ssl/key.pem` (Private Key)
5. **Clone repository** on your server
6. **Configure `.env`** with your settings
7. **Start services**:
```bash
docker-compose up -d
```

8. **Set webhook**:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/<YOUR_BOT_TOKEN>"
```

9. **Verify webhook**:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (polling)
NODE_ENV=development npm run dev
```

### Code Structure

- **Strategy Pattern**: Each site has its own configuration - no code changes needed
- **Modular Design**: Clear separation of concerns
- **Error Handling**: Comprehensive error handling at all levels
- **Logging**: Detailed logging for debugging and monitoring

### Tech Stack

- **Node.js 20 LTS**: Runtime environment
- **Telegraf**: Telegram Bot Framework
- **Express**: Web server for webhooks
- **jsdom**: Fast HTML parsing
- **Puppeteer**: Headless Chrome for lazy-loading
- **Axios**: HTTP requests
- **Archiver**: ZIP file creation
- **Docker**: Containerization
- **Nginx**: Reverse proxy with SSL

## 📦 Features in Detail

### Single Gallery Mode
- Fast image extraction using jsdom
- Concurrent downloads (5 parallel)
- Progress updates every 5 images
- Automatic thumbnail filtering
- ZIP compression and upload

### Multi Gallery Mode
- Puppeteer for lazy-loading support
- Auto-scroll to load all galleries
- Batch processing of galleries
- Individual progress tracking per gallery
- Organized folder structure in ZIP

### File Management
- Unique temporary directories per download
- Automatic cleanup of old files (1 hour)
- Size estimation before ZIP creation
- Human-readable size formatting

### Error Handling
- Retry logic for failed downloads
- Graceful degradation on partial failures
- User-friendly error messages
- Detailed logging for debugging

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Add support for new sites
- Improve documentation
- Submit pull requests

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ali Hosseini**
- GitHub: [@ali934h](https://github.com/ali934h)
- Website: [alihosseini.dev](https://alihosseini.dev)
- Bio: Front-end Developer from Tehran

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Modern Telegram Bot Framework
- [Puppeteer](https://pptr.dev/) - Headless Chrome for Node.js
- [jsdom](https://github.com/jsdom/jsdom) - JavaScript implementation of web standards
- [Docker](https://www.docker.com/) - Containerization platform
- [Cloudflare](https://www.cloudflare.com/) - SSL and DNS services

## 📊 Project Status

- ✅ Phase 1: Project setup and Docker configuration - **Complete**
- ✅ Phase 2: Core functionality implementation - **Complete**
- ⏳ Phase 3: Production deployment - **In Progress**

---

⭐ If you find this project helpful, please consider giving it a star!

## 📞 Support

If you need help or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the documentation carefully

---

**Made with ❤️ and Node.js**
