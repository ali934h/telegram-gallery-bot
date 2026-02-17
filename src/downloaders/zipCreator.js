/**
 * ZIP Creator
 * Creates ZIP archives from downloaded images
 * Handles both single and multi-gallery archives
 * Supports automatic splitting for large files
 */

const archiver = require('archiver');
const splitFile = require('split-file');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');
const FileManager = require('../utils/fileManager');

// Maximum file size for Telegram (45 MB to be safe)
const MAX_FILE_SIZE = 45 * 1024 * 1024; // 45 MB in bytes

class ZipCreator {
  /**
   * Create ZIP file from directory
   * @param {string} sourceDir - Source directory to zip
   * @param {string} outputPath - Output ZIP file path
   * @returns {Promise<Object>} Resolves with zip info {path, size}
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
        const size = archive.pointer();
        const sizeFormatted = FileManager.formatBytes(size);
        Logger.info(`ZIP created successfully: ${sizeFormatted}`);
        resolve({ path: outputPath, size });
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
   * Split large ZIP file into smaller parts
   * @param {string} zipPath - Path to ZIP file
   * @param {number} maxSize - Maximum size per part in bytes
   * @returns {Promise<Array>} Array of part file paths
   */
  static async splitZipFile(zipPath, maxSize = MAX_FILE_SIZE) {
    try {
      Logger.info(`Splitting ZIP file: ${path.basename(zipPath)}`);
      
      const names = await splitFile.splitFileBySize(zipPath, maxSize);
      
      Logger.info(`ZIP split into ${names.length} parts`);
      
      // Delete original ZIP file
      await fs.promises.unlink(zipPath);
      Logger.debug('Original ZIP file deleted');
      
      return names;
    } catch (error) {
      Logger.error('Failed to split ZIP file', { error: error.message });
      throw error;
    }
  }

  /**
   * Create ZIP and split if necessary
   * @param {string} sourceDir - Source directory
   * @param {string} outputPath - Output ZIP path
   * @returns {Promise<Array>} Array of file paths (single or multiple parts)
   */
  static async createAndSplitIfNeeded(sourceDir, outputPath) {
    try {
      // Create ZIP
      const { path: zipPath, size } = await this.createZip(sourceDir, outputPath);

      // Check if splitting is needed
      if (size > MAX_FILE_SIZE) {
        Logger.info(`ZIP size (${FileManager.formatBytes(size)}) exceeds limit, splitting...`);
        const parts = await this.splitZipFile(zipPath, MAX_FILE_SIZE);
        return parts;
      }

      // No splitting needed
      Logger.info('ZIP size within limits, no splitting needed');
      return [zipPath];
    } catch (error) {
      Logger.error('Failed to create and split ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Create ZIP from single gallery
   * @param {string} galleryDir - Gallery directory
   * @param {string} galleryName - Gallery name for ZIP filename
   * @returns {Promise<Array>} Array of file paths
   */
  static async createSingleGalleryZip(galleryDir, galleryName) {
    try {
      const zipFilename = `${galleryName}_${Date.now()}.zip`;
      const zipPath = path.join(path.dirname(galleryDir), zipFilename);

      return await this.createAndSplitIfNeeded(galleryDir, zipPath);
    } catch (error) {
      Logger.error('Failed to create single gallery ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Create ZIP from multiple galleries
   * @param {string} baseDir - Base directory containing gallery folders
   * @param {string} modelName - Model name for ZIP filename
   * @returns {Promise<Array>} Array of file paths
   */
  static async createMultiGalleryZip(baseDir, modelName) {
    try {
      const zipFilename = `${modelName}_galleries_${Date.now()}.zip`;
      const zipPath = path.join(path.dirname(baseDir), zipFilename);

      return await this.createAndSplitIfNeeded(baseDir, zipPath);
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
