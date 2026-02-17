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
├── ssl/                            # SSL certificates (not in repo)
├── temp/                           # Temporary files
├── docker-compose.yml             # Production mode
├── docker-compose.dev.yml         # Development mode (hot reload)
├── nginx.conf                      # Production nginx config
├── nginx.dev.conf                  # Development nginx config
├── nodemon.json                   # Nodemon configuration
├── Dockerfile
└── .env
```

---

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Domain with SSL (required for webhook)
- Cloudflare Origin CA certificate (for HTTPS)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
```

2. **Setup SSL certificates**:
```bash
# Create ssl directory
mkdir ssl

# Get Cloudflare Origin CA certificate
# Go to: Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
# Download cert.pem and key.pem

# Place certificates
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/

# Secure permissions
chmod 600 ssl/*.pem
```

3. **Configure environment variables**:
```bash
cp .env.example .env
nano .env  # Add your BOT_TOKEN and other settings
```

4. **Choose your mode**:

#### 🔥 Development Mode (Hot Reload - Recommended for Development)
```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f bot
```

**✨ Benefits:**
- ✅ Code changes auto-reload instantly
- ✅ Strategy changes auto-reload
- ✅ No rebuild needed!
- ⚡ 1-second restart time

#### 🚀 Production Mode (Stable for Deployment)
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f bot
```

---

## 📚 Complete Development Workflow Guide

### 🔥 Scenario 1: Code Changes (src/ or strategies/)

**This is 99% of your work!**

#### Initial Setup (One Time)
```bash
# Start dev mode
docker-compose -f docker-compose.dev.yml up -d
```

#### Daily Workflow
```bash
# 1. Edit code locally
nano src/bot.js
# or
nano strategies/elitebabes.json

# 2. Save file
# ✨ Bot auto-restarts in 1 second!

# 3. Check logs to confirm restart
docker-compose -f docker-compose.dev.yml logs -f bot
# You'll see: [nodemon] restarting due to changes...
```

**No rebuild, no restart command needed!** 🎉

---

### 🔄 Scenario 2: Pull Changes from GitHub

**When you push from laptop and pull on server:**

```bash
# 1. Pull latest changes
git pull

# 2. That's it! Nodemon detects and restarts!
# ✨ Auto-reload in 1 second

# 3. Check logs
docker-compose -f docker-compose.dev.yml logs -f bot
```

**Works for:**
- ✅ `src/**/*.js` changes
- ✅ `strategies/**/*.json` changes
- ✅ Any code modifications

**No rebuild needed!** 🚀

---

### 📦 Scenario 3: Adding New npm Package

**When package.json changes:**

```bash
# 1. Pull changes (or edit locally)
git pull

# 2. Install new packages inside container
docker-compose -f docker-compose.dev.yml exec bot npm install

# 3. Restart bot
docker-compose -f docker-compose.dev.yml restart bot

# 4. Check logs
docker-compose -f docker-compose.dev.yml logs -f bot
```

**Time: ~10-30 seconds** (no full rebuild!)

---

### 🔧 Scenario 4: Dockerfile or System Changes

**Only when these files change:**
- `Dockerfile`
- System packages (apt-get install)
- Base image changes

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Rebuild
docker-compose -f docker-compose.dev.yml build --no-cache

# Start
docker-compose -f docker-compose.dev.yml up -d

# Check logs
docker-compose -f docker-compose.dev.yml logs -f bot
```

**Time: ~2-3 minutes** (rare scenario)

---

### 🔄 Scenario 5: Switch Between Dev and Production

#### Dev → Production
```bash
# Stop dev mode
docker-compose -f docker-compose.dev.yml down

# Start production
docker-compose up -d
```

#### Production → Dev
```bash
# Stop production
docker-compose down

# Start dev mode
docker-compose -f docker-compose.dev.yml up -d
```

---

### 🔍 Scenario 6: Debugging Issues

#### View Logs
```bash
# Real-time logs (dev mode)
docker-compose -f docker-compose.dev.yml logs -f bot

# Real-time logs (production)
docker-compose logs -f bot

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 bot
```

#### Enter Container Shell
```bash
# Dev mode
docker-compose -f docker-compose.dev.yml exec bot sh

# Production mode
docker-compose exec bot sh

# Inside container, you can:
ls -la /app/src
cat /app/strategies/elitebabes.json
node --version
npm list
```

#### Check Container Status
```bash
# Dev mode
docker-compose -f docker-compose.dev.yml ps

# Production mode
docker-compose ps
```

---

## 📝 Summary Table

| Scenario | Dev Mode | Time | Production Mode | Time |
|----------|----------|------|-----------------|------|
| **Code changes** (src/, strategies/) | `git pull` | 1 sec | `git pull` + rebuild | 2-3 min |
| **New npm package** | `npm install` in container | 10-30 sec | Full rebuild | 2-3 min |
| **Dockerfile changes** | Rebuild | 2-3 min | Rebuild | 2-3 min |
| **Daily development** | Edit & save | 1 sec | Edit, rebuild, restart | 2-3 min |

**Recommendation:** Use Dev Mode for development, Production for deployment! 🚀

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_DOMAIN=https://your-domain.com
DOWNLOAD_BASE_URL=https://your-domain.com/downloads
NODE_ENV=production
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

**In dev mode:** Just save and bot auto-reloads! 🔥

**In production:** Rebuild needed.

---

## 📖 Usage

1. Start the bot: `/start`
2. Choose mode:
   - 📸 **Single Gallery**: One gallery
   - 📚 **Multi Gallery**: All galleries from model page
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

## 🐳 Docker Commands Reference

### Development Mode

```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down

# Restart bot only
docker-compose -f docker-compose.dev.yml restart bot

# View logs
docker-compose -f docker-compose.dev.yml logs -f bot

# Rebuild (rare)
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Install npm package
docker-compose -f docker-compose.dev.yml exec bot npm install

# Shell access
docker-compose -f docker-compose.dev.yml exec bot sh

# Check status
docker-compose -f docker-compose.dev.yml ps
```

### Production Mode

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart bot

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f bot

# Shell access
docker-compose exec bot sh

# Check status
docker-compose ps
```

---

## 🌐 Production Deployment

### With DigitalOcean + Cloudflare

1. **Create Droplet** with Docker (Ubuntu 22.04/24.04)
2. **Configure DNS** in Cloudflare
3. **Get SSL certificates** from Cloudflare (see SSL Setup above)
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

5. **Start in production mode**:
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
- **Nodemon**: Hot reload (development)

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

### Development Experience
- 🔥 Hot reload with nodemon
- 📁 Bind mounts for instant updates
- 🚀 No rebuild for code changes
- ⚡ 1-second restart time

---

## 🚨 Troubleshooting

### Error 521: Web Server is Down

**Symptoms:** Cloudflare shows "Error 521" when accessing download links.

**Causes:**
1. Nginx container is not running
2. SSL certificates are missing or incorrectly mounted
3. Wrong container name in nginx config

**Solutions:**

```bash
# 1. Check container status
docker-compose -f docker-compose.dev.yml ps

# 2. Check nginx logs
docker-compose -f docker-compose.dev.yml logs nginx

# 3. Verify SSL certificates exist
ls -la ssl/
# Should show: cert.pem and key.pem

# 4. Verify SSL mount in docker-compose
cat docker-compose.dev.yml | grep ssl
# Should show: - ./ssl:/etc/ssl/cloudflare:ro

# 5. Restart services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Bot Container Unhealthy

**Check logs:**
```bash
docker-compose -f docker-compose.dev.yml logs --tail=50 bot
```

**Common fixes:**
- Missing environment variables in `.env`
- Bot token invalid
- Port 3000 already in use

### Nginx Cannot Find Bot

**Error:** `host not found in upstream "telegram-gallery-bot"`

**Cause:** Wrong container name in nginx config.

**Solution:**
- Dev mode uses: `nginx.dev.conf` → `telegram-gallery-bot-dev`
- Production uses: `nginx.conf` → `telegram-gallery-bot`

### Files Not Downloading

**Check:**
1. Downloads volume is mounted correctly
2. File exists in container:
   ```bash
   docker-compose -f docker-compose.dev.yml exec nginx ls -la /usr/share/nginx/html/downloads/
   ```
3. Nginx has read permissions

---

## 🤝 Contributing

1. Fork the repository
2. Start dev mode: `docker-compose -f docker-compose.dev.yml up -d`
3. Make changes (they auto-reload!)
4. Test thoroughly
5. Commit: `git commit -m 'Add feature'`
6. Push and create PR

---

## ❓ FAQ

### Q: Do I need to rebuild after every code change?
**A:** No! Use dev mode - code changes auto-reload in 1 second.

### Q: What if I add a new npm package?
**A:** Run `docker-compose -f docker-compose.dev.yml exec bot npm install` (no rebuild).

### Q: When do I need to rebuild?
**A:** Only when `Dockerfile` or system packages change (very rare).

### Q: Can I switch between dev and production?
**A:** Yes! Just `down` one and `up` the other.

### Q: How do I debug issues?
**A:** Use `logs -f bot` or enter container with `exec bot sh`.

### Q: Why separate nginx.conf and nginx.dev.conf?
**A:** Different container names: `telegram-gallery-bot` (prod) vs `telegram-gallery-bot-dev` (dev).

### Q: Do I need SSL for local development?
**A:** Yes, if using webhook. Use Cloudflare Origin CA or self-signed certificates.

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

- [Telegraf](https://telegraf.js.org/) - Modern Telegram Bot Framework
- [Puppeteer](https://pptr.dev/) - Headless Chrome for Node.js
- [jsdom](https://github.com/jsdom/jsdom/) - JavaScript implementation of web standards
- [Docker](https://www.docker.com/) - Containerization platform
- [Nodemon](https://nodemon.io/) - Auto-reload for Node.js
- [Cloudflare](https://www.cloudflare.com/) - SSL and CDN

---

⭐ **Star this repo if you find it helpful!**

**Made with ❤️ and Node.js**
