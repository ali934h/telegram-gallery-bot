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
- 📦 **7z Output**: All images packaged in compressed archives with folder structure
- 🐳 **Docker Ready**: Easy deployment and scaling
- 🔒 **SSL Support**: Secure webhook with Cloudflare
- 🔄 **Auto Cleanup**: Automatic temporary file management

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
├── ssl/                            # SSL certificates (not in repo)
├── temp/                           # Temporary files
├── docker-compose.yml             # Docker configuration
├── nginx.conf                      # Nginx configuration
├── Dockerfile
└── .env
```

---

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Domain with SSL certificate
- Cloudflare Origin CA certificate

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
```

**2. Setup SSL certificates:**
```bash
# Create ssl directory
mkdir ssl

# Get Cloudflare Origin CA certificate:
# Go to: Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
# Download cert.pem and key.pem

# Place certificates
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/

# Secure permissions
chmod 600 ssl/*.pem
```

**3. Configure environment variables:**
```bash
cp .env.example .env
nano .env
```

**Required settings in `.env`:**
```env
BOT_TOKEN=your_telegram_bot_token
WEBHOOK_DOMAIN=https://your-domain.com
DOWNLOAD_BASE_URL=https://your-domain.com/downloads
NODE_ENV=production
```

**4. Start the bot:**
```bash
docker-compose up -d
```

**5. Set webhook:**
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/<YOUR_BOT_TOKEN>"
```

**6. Verify webhook:**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Webhook Configuration
WEBHOOK_DOMAIN=https://your-domain.com
WEBHOOK_PATH=/webhook

# Server Configuration
PORT=3000
NODE_ENV=production

# Direct Download Configuration
DOWNLOADS_DIR=/app/downloads
DOWNLOAD_BASE_URL=https://your-domain.com/downloads

# Optional: Timeout settings (in seconds)
DOWNLOAD_TIMEOUT=300
SCRAPE_TIMEOUT=60

# Logging
LOG_LEVEL=info
```

### SSL Certificates Setup

**For Cloudflare:**

1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server
2. Click "Create Certificate"
3. Choose:
   - Private key type: RSA (2048)
   - Certificate validity: 15 years
   - Hostnames: `*.your-domain.com`, `your-domain.com`
4. Click "Create"
5. Download both:
   - Origin Certificate → save as `ssl/cert.pem`
   - Private Key → save as `ssl/key.pem`

**Important:** Keep these files secure and never commit to git!

### Adding New Sites

**Create a JSON file in `strategies/` directory:**

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

After adding a new strategy, rebuild and restart:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 📖 Usage

1. Start the bot: `/start`
2. Choose mode:
   - 📸 **Single Gallery**: Download one gallery
   - 📚 **Multi Gallery**: Download all galleries from model page
3. Send URL
4. Download your 7z file! 🎉

### Archive Structure

#### Single Gallery Mode:
```
gallery-name_timestamp.7z
└── gallery-name/
    ├── 001_image1.jpg
    ├── 002_image2.jpg
    └── 003_image3.jpg
```

#### Multi Gallery Mode:
```
model-name_galleries_timestamp.7z
├── gallery-1/
│   ├── 001_image1.jpg
│   └── 002_image2.jpg
├── gallery-2/
│   ├── 001_image1.jpg
│   └── 002_image2.jpg
└── gallery-3/
    ├── 001_image1.jpg
    └── 002_image2.jpg
```

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View bot logs only
docker-compose logs -f bot

# View nginx logs only
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps

# Enter bot container
docker-compose exec bot sh

# Enter nginx container
docker-compose exec nginx sh
```

---

## 🌐 Production Deployment

### With DigitalOcean + Cloudflare

1. **Create Droplet** with Docker (Ubuntu 22.04/24.04)
2. **Configure DNS** in Cloudflare
3. **Get SSL certificates** from Cloudflare Origin CA
4. **Clone and configure**:

```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot

# Setup SSL
mkdir ssl
# Upload cert.pem and key.pem to ssl/

# Configure environment
cp .env.example .env
nano .env  # Add BOT_TOKEN, WEBHOOK_DOMAIN, etc.
```

5. **Start services**:
```bash
docker-compose up -d
```

6. **Set webhook**:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/<TOKEN>"
```

7. **Verify**:
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

---

## 🔧 Tech Stack

- **Node.js 20 LTS**: Runtime environment
- **Telegraf**: Telegram Bot Framework
- **Express**: Webhook server
- **jsdom**: Fast HTML parsing
- **Puppeteer**: Headless browser for lazy-loading
- **Axios**: HTTP client
- **7zip**: Archive creation
- **Docker**: Containerization
- **Nginx**: Reverse proxy with SSL
- **Cloudflare**: SSL and CDN

---

## 📦 Features in Detail

### Rate Limit Protection
- Time-based Telegram updates (every 5 seconds)
- Automatic retry with exponential backoff
- No more "Too Many Requests" errors

### Cross-Device File Operations
- Uses `copyFile + unlink` instead of `rename`
- Works with Docker volumes on different filesystems
- Reliable file moving between temp and downloads

### Folder Structure in Archives
- Single gallery: Images inside gallery folder
- Multi gallery: Each gallery in separate folder
- Organized and easy to navigate

---

## 🚨 Troubleshooting

### Error 521: Web Server is Down

**Symptoms:** Cloudflare shows "Error 521" when accessing download links.

**Solutions:**

```bash
# Check container status
docker-compose ps

# Check nginx logs
docker-compose logs nginx

# Verify SSL certificates exist
ls -la ssl/

# Restart services
docker-compose restart
```

### Bot Not Responding

```bash
# Check logs
docker-compose logs bot

# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Restart bot
docker-compose restart bot
```

### Files Not Downloading

```bash
# Check if file exists
docker-compose exec nginx ls -la /usr/share/nginx/html/downloads/

# Check nginx access logs
docker-compose logs nginx | grep downloads

# Check permissions
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

---

## ❓ FAQ

### Q: How do I update the bot code?
**A:** Pull changes and rebuild:
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Q: How do I add a new site?
**A:** Create a JSON strategy file in `strategies/`, then rebuild.

### Q: Can I use self-signed SSL certificates?
**A:** Yes, but Cloudflare Origin CA certificates are recommended for production.

### Q: How do I check if webhook is working?
**A:** `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Q: How do I backup the bot?
**A:** Backup `.env`, `ssl/`, and `strategies/` folders.

---

## 📝 License

MIT License

---

## 👨‍💻 Author

**Ali Hosseini**
- GitHub: [@ali934h](https://github.com/ali934h)
- Website: [alihosseini.dev](https://alihosseini.dev)

---

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [Puppeteer](https://pptr.dev/) - Headless Chrome for Node.js
- [jsdom](https://github.com/jsdom/jsdom/) - JavaScript implementation of web standards
- [Docker](https://www.docker.com/) - Containerization platform
- [Cloudflare](https://www.cloudflare.com/) - SSL and CDN

---

⭐ **Star this repo if you find it helpful!**

**Made with ❤️ and Node.js**
