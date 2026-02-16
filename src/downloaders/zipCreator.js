/**
 * ZIP Creator
 * Creates ZIP archives from downloaded images
 * Handles both single and multi-gallery archives
 */

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');
const FileManager = require('../utils/fileManager');

class ZipCreator {
  /**
   * Create ZIP file from directory
   * @param {string} sourceDir - Source directory to zip
   * @param {string} outputPath - Output ZIP file path
   * @returns {Promise} Resolves when zip is created
   */
  static async createZip(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      Logger.info(`Creating ZIP: ${path.basename(outputPath)}`);

      // Create write stream
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 6 } // Compression level (0-9)
      });

      // Event handlers
      output.on('close', () => {
        const size = FileManager.formatBytes(archive.pointer());
        Logger.info(`ZIP created successfully: ${size}`);
        resolve(outputPath);
      });

      output.on('error', (error) => {
        Logger.error('Output stream error', { error: error.message });
        reject(error);
      });

      archive.on('error', (error) => {
        Logger.error('Archive error', { error: error.message });
        reject(error);
      });

      archive.on('warning', (warning) => {
        if (warning.code === 'ENOENT') {
          Logger.warn('Archive warning', { warning: warning.message });
        } else {
          Logger.error('Archive warning', { warning: warning.message });
          reject(warning);
        }
      });

      // Pipe archive to output
      archive.pipe(output);

      // Add directory to archive
      archive.directory(sourceDir, false);

      // Finalize archive
      archive.finalize();
    });
  }

  /**
   * Create ZIP from single gallery
   * @param {string} galleryDir - Gallery directory
   * @param {string} galleryName - Gallery name for ZIP filename
   * @returns {string} Path to created ZIP file
   */
  static async createSingleGalleryZip(galleryDir, galleryName) {
    try {
      const zipFilename = `${galleryName}_${Date.now()}.zip`;
      const zipPath = path.join(path.dirname(galleryDir), zipFilename);

      await this.createZip(galleryDir, zipPath);

      return zipPath;
    } catch (error) {
      Logger.error('Failed to create single gallery ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Create ZIP from multiple galleries
   * @param {string} baseDir - Base directory containing gallery folders
   * @param {string} modelName - Model name for ZIP filename
   * @returns {string} Path to created ZIP file
   */
  static async createMultiGalleryZip(baseDir, modelName) {
    try {
      const zipFilename = `${modelName}_galleries_${Date.now()}.zip`;
      const zipPath = path.join(path.dirname(baseDir), zipFilename);

      await this.createZip(baseDir, zipPath);

      return zipPath;
    } catch (error) {
      Logger.error('Failed to create multi-gallery ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Get estimated ZIP size (approximate)
   * @param {string} sourceDir - Source directory
   * @returns {Promise<string>} Estimated size in human-readable format
   */
  static async getEstimatedSize(sourceDir) {
    try {
      // Get total size of all files
      const getSize = async (dir) => {
        let totalSize = 0;
        const items = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            totalSize += await getSize(itemPath);
          } else {
            const stats = await fs.promises.stat(itemPath);
            totalSize += stats.size;
          }
        }

        return totalSize;
      };

      const totalSize = await getSize(sourceDir);
      // ZIP compression typically achieves 10-20% reduction for images
      const estimatedZipSize = totalSize * 0.85;

      return FileManager.formatBytes(estimatedZipSize);
    } catch (error) {
      Logger.error('Failed to estimate ZIP size', { error: error.message });
      return 'Unknown';
    }
  }
}

module.exports = ZipCreator;
