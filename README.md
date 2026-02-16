# 🤖 Telegram Gallery Bot

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

یک ربات تلگرام حرفه‌ای برای دانلود خودکار عکس‌های گالری از سایت‌های مختلف با پشتیبانی کامل از Docker و استقرار آسان.

## ✨ ویژگی‌های اصلی

- 📸 **Single Gallery Mode**: دانلود تمام عکس‌های یک گالری خاص
- 📚 **Multi Gallery Mode**: دانلود تمام گالری‌های یک مدل از صفحه Model
- 🎯 **Strategy Pattern**: اضافه کردن سایت جدید بدون تغییر کد
- ⚡ **jsdom**: پردازش سریع HTML برای استخراج عکس‌ها
- 🌐 **Puppeteer**: پشتیبانی از lazy loading برای صفحات پیچیده
- 📦 **خروجی ZIP**: تمام عکس‌ها در یک فایل فشرده
- 🐳 **Docker Ready**: استقرار آسان و سریع
- 🔒 **SSL Support**: امنیت کامل با Cloudflare
- 🔄 **Auto Cleanup**: مدیریت خودکار فایل‌های موقت

## 🏗️ معماری پروژه

```
telegram-gallery-bot/
├── src/
│   ├── index.js                    # Express server + Webhook
│   ├── bot.js                      # Telegram bot logic
│   ├── config/
│   │   └── siteStrategies.json    # تنظیمات selectors سایت‌ها
│   ├── scrapers/
│   │   ├── strategyEngine.js      # مدیریت strategies
│   │   ├── jsdomScraper.js        # استخراج با jsdom
│   │   └── puppeteerScraper.js    # استخراج با Puppeteer
│   ├── downloaders/
│   │   ├── imageDownloader.js     # دانلود عکس‌ها
│   │   └── zipCreator.js          # ساخت فایل ZIP
│   └── utils/
│       ├── fileManager.js         # مدیریت فایل‌ها
│       └── logger.js              # لاگ‌گیری
├── temp/                           # فایل‌های موقت
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .env
```

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- Docker و Docker Compose
- یک ربات تلگرام (از [@BotFather](https://t.me/botfather))
- دامنه با SSL (اختیاری برای webhook)

### مراحل نصب

1. **Clone کردن repository**:
```bash
git clone https://github.com/ali934h/telegram-gallery-bot.git
cd telegram-gallery-bot
```

2. **تنظیم environment variables**:
```bash
cp .env.example .env
nano .env  # ویرایش و افزودن BOT_TOKEN
```

3. **اجرای با Docker**:
```bash
docker-compose up -d
```

4. **مشاهده logs**:
```bash
docker-compose logs -f bot
```

## ⚙️ تنظیمات

### متغیرهای محیطی (.env)

```env
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com
PORT=3000
NODE_ENV=production
```

### اضافه کردن سایت جدید

برای اضافه کردن سایت جدید، فقط کافیست entry جدیدی در `src/config/siteStrategies.json` اضافه کنید:

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

## 📖 نحوه استفاده

1. ربات را در تلگرام استارت کنید: `/start`
2. یکی از حالت‌ها را انتخاب کنید:
   - 📸 **Single Gallery**: دانلود یک گالری
   - 📚 **Multi Gallery**: دانلود تمام گالری‌های یک مدل
3. لینک مورد نظر را ارسال کنید
4. منتظر بمانید تا ربات عکس‌ها را دانلود و ZIP کند
5. فایل ZIP را دریافت کنید! 🎉

## 🐳 استقرار با Docker

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose up -d
```

### توقف و حذف
```bash
docker-compose down
```

### Rebuild بعد از تغییرات
```bash
docker-compose up -d --build
```

## 🌐 تنظیمات Production

### با DigitalOcean + Cloudflare

1. **ایجاد Droplet** با Docker Marketplace Image
2. **تنظیم DNS** در Cloudflare (A Record به IP سرور)
3. **دریافت Origin Certificate** از Cloudflare
4. **قرار دادن certificates** در پوشه `ssl/`
5. **تنظیم webhook**:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-domain.com/webhook/<YOUR_BOT_TOKEN>"
```

## 🔧 توسعه

### نصب dependencies در local
```bash
npm install
```

### اجرا در حالت development
```bash
npm run dev
```

### ساختار کد

- **Strategy Pattern**: هر سایت تنظیمات مخصوص خود را دارد
- **Modular Design**: هر قسمت مسئولیت مشخصی دارد
- **Error Handling**: مدیریت خطا در تمام لایه‌ها
- **Logging**: ثبت تمام رویدادها برای debugging

## 🤝 مشارکت

هر گونه مشارکت، Issue یا Pull Request خوش‌آمد است!

1. Fork کنید
2. Branch جدید بسازید: `git checkout -b feature/amazing-feature`
3. تغییرات را commit کنید: `git commit -m 'Add amazing feature'`
4. Push کنید: `git push origin feature/amazing-feature`
5. Pull Request باز کنید

## 📝 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## 👨‍💻 سازنده

**Ali Hosseini**
- GitHub: [@ali934h](https://github.com/ali934h)
- Website: [alihosseini.dev](https://alihosseini.dev)

## 🙏 تشکر

- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [Puppeteer](https://pptr.dev/) - Headless Chrome
- [jsdom](https://github.com/jsdom/jsdom) - HTML Parser

---

⭐ اگر این پروژه براتون مفید بود، یک ستاره بدید!
