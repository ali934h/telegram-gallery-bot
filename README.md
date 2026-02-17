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
- 📦 **7z Output**: All images packaged in compressed archives
- 🐳 **Docker Ready**: Easy deployment and scaling
- 🔒 **SSL Support**: Secure webhook with Cloudflare
- 🔄 **Auto Cleanup**: Automatic temporary file management
- 🔥 **Hot Reload**: Development mode with instant code changes

## 🏗️ Project Architecture

```
telegram-gallery-bot/
├── src/
│   ├── index.js                    # Express server + Webhook
│   ├── bot.js                      # Telegram bot logic
│   ├── scrapers/
│   │   ├── strategyEngine.js      # Strategy management
│   │   ├── jsdomScraper.js        # Fast HTML parsing
│   │   └── puppeteerScraper.js    # Lazy-loading support
│   ├── downloaders/
│   │   ├── imageDownloader.js     # Image downloading
│   │   └── zipCreator.js          # 7z creation
│   └── utils/
│       ├── fileManager.js         # File management
│       └── logger.js              # Logging utility
├── strategies/                     # Site configurations (JSON)
├── temp/                           # Temporary files
├── docker-compose.yml             # Production mode
├── docker-compose.dev.yml         # Development mode (hot reload)
├── nodemon.json                   # Nodemon configuration
├── Dockerfile
├── nginx.conf
└── .env
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Domain with SSL (optional, for webhook)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
```

2. **Configure environment variables**:
```bash
cp .env.example .env
nano .env  # Add your BOT_TOKEN and other settings
```

3. **Choose your mode**:

#### 🔥 Development Mode (Hot Reload - Recommended for coding)
```bash
# Pull latest changes
git pull

# Start with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f bot
```

**✨ In dev mode:**
- ✅ Changes in `src/` auto-reload (no rebuild needed!)
- ✅ Changes in `strategies/` auto-reload
- ✅ Just edit code and save - bot restarts automatically!
- ⚡ Perfect for adding new sites or fixing bugs

#### 🚀 Production Mode (Stable)
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f bot
```

## 🔥 Development Workflow

### Making Changes (No More Rebuilds!)

1. **Start dev mode once**:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. **Edit any file** in `src/` or `strategies/`:
```bash
nano src/bot.js
# or
nano strategies/elitebabes.json
```

3. **Save the file** → Bot restarts automatically! ⚡

4. **Check logs** to see restart:
```bash
docker-compose -f docker-compose.dev.yml logs -f bot
# You'll see: [nodemon] restarting due to changes...
```

### Example: Adding a New Site

**Old way (Production mode):** ❌
```bash
nano strategies/newsite.json     # Edit
docker-compose down              # Stop
docker-compose build --no-cache  # Rebuild (2-3 minutes)
docker-compose up -d             # Start
```

**New way (Development mode):** ✅
```bash
nano strategies/newsite.json  # Edit and save
# Bot auto-restarts in 1 second! 🚀
```

### Stop Development Mode
```bash
docker-compose -f docker-compose.dev.yml down
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_DOMAIN=https://your-domain.com
DOWNLOAD_BASE_URL=https://your-domain.com/downloads
NODE_ENV=production
```

### Adding New Sites

Create a JSON file in `strategies/` directory:

```json
{
  "domain": "example.com",
  "name": "ExampleSite",
  "galleries": {
    "selector": "a.gallery-link",
    "attr": "href"
  },
  "images": {
    "selector": "img.photo",
    "attr": "src",
    "filterPatterns": ["thumb", "preview"]
  }
}
```

**In dev mode**, just save and the bot reloads! 🔥

## 📖 Usage

1. Start the bot: `/start`
2. Choose mode:
   - 📸 **Single Gallery**: One gallery
   - 📚 **Multi Gallery**: All galleries from model page
3. Send URL
4. Download your 7z file! 🎉

## 🐳 Docker Commands

### Development Mode
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.dev.yml logs -f bot

# Stop
docker-compose -f docker-compose.dev.yml down

# Restart (if needed)
docker-compose -f docker-compose.dev.yml restart bot
```

### Production Mode
```bash
# Start
docker-compose up -d

# Rebuild after major changes
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Logs
docker-compose logs -f bot

# Stop
docker-compose down
```

## 🌐 Production Deployment

### With DigitalOcean + Cloudflare

1. **Create Droplet** with Docker (Ubuntu 22.04/24.04)
2. **Configure DNS** in Cloudflare
3. **Get SSL certificates** from Cloudflare
4. **Clone and configure**:
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
nano .env  # Configure
```

5. **Start in production mode**:
```bash
docker-compose up -d
```

6. **Set webhook**:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/<TOKEN>"
```

## 🔧 Tech Stack

- **Node.js 20 LTS**: Runtime
- **Telegraf**: Telegram Bot Framework
- **Express**: Webhook server
- **jsdom**: HTML parsing
- **Puppeteer**: Headless browser
- **Axios**: HTTP client
- **7zip**: Archive creation
- **Docker**: Containerization
- **Nginx**: Reverse proxy
- **Nodemon**: Hot reload (dev)

## 📦 Features

### Rate Limit Protection
- Time-based Telegram updates (every 5 seconds)
- Automatic retry with exponential backoff
- No more "Too Many Requests" errors

### Cross-Device File Operations
- Uses `copyFile + unlink` instead of `rename`
- Works with Docker volumes on different filesystems
- Reliable file moving between temp and downloads

### Development Experience
- 🔥 Hot reload with nodemon
- 📁 Bind mounts for instant code updates
- 🚀 No rebuild needed for code changes
- ⚡ 1-second restart time

## 🤝 Contributing

1. Fork the repository
2. Start dev mode: `docker-compose -f docker-compose.dev.yml up -d`
3. Make your changes (they auto-reload!)
4. Test thoroughly
5. Commit: `git commit -m 'Add feature'`
6. Push and create PR

## 📝 License

MIT License

## 👨‍💻 Author

**Ali Hosseini**
- GitHub: [@ali934h](https://github.com/ali934h)
- Website: [alihosseini.dev](https://alihosseini.dev)

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/)
- [Puppeteer](https://pptr.dev/)
- [jsdom](https://github.com/jsdom/jsdom)
- [Docker](https://www.docker.com/)
- [Nodemon](https://nodemon.io/)

---

⭐ Star this repo if you find it helpful!

**Made with ❤️ and Node.js**
