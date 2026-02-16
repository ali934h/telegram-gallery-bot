/**
 * Puppeteer Scraper
 * Handles lazy-loaded content using headless Chrome
 * Used for extracting gallery links from model pages
 */

const puppeteer = require('puppeteer');
const Logger = require('../utils/logger');

class PuppeteerScraper {
  /**
   * Launch browser with optimized settings
   * @returns {Browser} Puppeteer browser instance
   */
  static async launchBrowser() {
    try {
      Logger.debug('Launching Puppeteer browser');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      Logger.debug('Browser launched successfully');
      return browser;
    } catch (error) {
      Logger.error('Failed to launch browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Auto-scroll page to load lazy-loaded content
   * @param {Page} page - Puppeteer page instance
   */
  static async autoScroll(page) {
    try {
      Logger.debug('Auto-scrolling page to load lazy content');
      
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a bit more for any final lazy loads
      await page.waitForTimeout(2000);
      Logger.debug('Auto-scroll completed');
    } catch (error) {
      Logger.error('Auto-scroll failed', { error: error.message });
    }
  }

  /**
   * Extract gallery links from model page
   * @param {string} url - Model page URL
   * @param {Object} strategy - Strategy configuration for the site
   * @returns {Array} Array of gallery URLs
   */
  static async extractGalleryLinks(url, strategy) {
    let browser;
    
    try {
      Logger.info(`Extracting gallery links from: ${url}`);

      // Launch browser
      browser = await this.launchBrowser();
      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to page
      Logger.debug(`Navigating to: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      // Auto-scroll to load all galleries
      await this.autoScroll(page);

      // Extract gallery links using strategy selector
      const selector = strategy.galleries.selector;
      const attr = strategy.galleries.attr;

      Logger.debug(`Extracting links with selector: ${selector}`);

      const galleryLinks = await page.$$eval(
        selector,
        (elements, attribute) => {
          return elements.map(el => el.getAttribute(attribute)).filter(link => link);
        },
        attr
      );

      // Convert relative URLs to absolute if needed
      const baseUrl = new URL(url).origin;
      const absoluteLinks = galleryLinks.map(link => {
        if (link.startsWith('http')) {
          return link;
        }
        return new URL(link, baseUrl).href;
      });

      // Remove duplicates
      const uniqueLinks = [...new Set(absoluteLinks)];

      Logger.info(`Extracted ${uniqueLinks.length} gallery links`);
      return uniqueLinks;
    } catch (error) {
      Logger.error(`Failed to extract gallery links from: ${url}`, { error: error.message });
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        Logger.debug('Browser closed');
      }
    }
  }
}

module.exports = PuppeteerScraper;
