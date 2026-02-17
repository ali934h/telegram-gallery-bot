/**
 * ZIP Creator
 * Creates ZIP archives from downloaded images
 * Handles both single and multi-gallery archives
 * Supports automatic splitting using zip command for WinRAR compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');
const FileManager = require('../utils/fileManager');

// Maximum file size for Telegram (45 MB to be safe)
const MAX_FILE_SIZE_MB = 45;

class ZipCreator {
  /**
   * Create ZIP file using zip command with optional splitting
   * @param {string} sourceDir - Source directory to zip
   * @param {string} outputPath - Output ZIP file path
   * @param {boolean} enableSplit - Enable multi-volume splitting
   * @returns {Promise<Array>} Array of created file paths
   */
  static async createZipWithCommand(sourceDir, outputPath, enableSplit = false) {
    try {
      Logger.info(`Creating ZIP: ${path.basename(outputPath)}`);
      
      const outputDir = path.dirname(outputPath);
      const outputName = path.basename(outputPath, '.zip');
      
      // Change to source directory for cleaner archive structure
      const originalDir = process.cwd();
      process.chdir(sourceDir);
      
      try {
        let command;
        
        if (enableSplit) {
          // Create multi-volume ZIP (compatible with WinRAR/7-Zip)
          command = `zip -r -s ${MAX_FILE_SIZE_MB}m "${path.join(outputDir, outputName)}.zip" .`;
          Logger.info(`Creating multi-volume ZIP with ${MAX_FILE_SIZE_MB}MB parts`);
        } else {
          // Create regular ZIP
          command = `zip -r "${outputPath}" .`;
        }
        
        Logger.debug(`Executing: ${command}`);
        execSync(command, { stdio: 'pipe' });
        
      } finally {
        process.chdir(originalDir);
      }
      
      // Find all created files
      const createdFiles = [];
      
      if (enableSplit) {
        // Multi-volume: find .zip, .z01, .z02, etc.
        const baseName = path.join(outputDir, outputName);
        
        // Check for main zip
        if (fs.existsSync(`${baseName}.zip`)) {
          createdFiles.push(`${baseName}.zip`);
        }
        
        // Check for volumes (.z01, .z02, ...)
        let volumeIndex = 1;
        while (true) {
          const volumePath = `${baseName}.z${String(volumeIndex).padStart(2, '0')}`;
          if (fs.existsSync(volumePath)) {
            createdFiles.push(volumePath);
            volumeIndex++;
          } else {
            break;
          }
        }
        
        Logger.info(`Created ${createdFiles.length} volume(s)`);
      } else {
        // Single file
        if (fs.existsSync(outputPath)) {
          createdFiles.push(outputPath);
          const stats = fs.statSync(outputPath);
          Logger.info(`ZIP created successfully: ${FileManager.formatBytes(stats.size)}`);
        }
      }
      
      return createdFiles;
      
    } catch (error) {
      Logger.error('Failed to create ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Create ZIP and split if necessary
   * @param {string} sourceDir - Source directory
   * @param {string} outputPath - Output ZIP path
   * @returns {Promise<Array>} Array of file paths (single or multiple volumes)
   */
  static async createAndSplitIfNeeded(sourceDir, outputPath) {
    try {
      // Get estimated size first
      const estimatedSize = await this.getDirectorySize(sourceDir);
      const estimatedZipSize = estimatedSize * 0.85; // Approximate compression
      const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (estimatedZipSize > maxSizeBytes) {
        Logger.info(
          `Estimated ZIP size (${FileManager.formatBytes(estimatedZipSize)}) exceeds limit, ` +
          `creating multi-volume archive...`
        );
        return await this.createZipWithCommand(sourceDir, outputPath, true);
      } else {
        Logger.info('Estimated ZIP size within limits, creating single file');
        return await this.createZipWithCommand(sourceDir, outputPath, false);
      }
      
    } catch (error) {
      Logger.error('Failed to create and split ZIP', { error: error.message });
      throw error;
    }
  }

  /**
   * Get total size of directory
   * @param {string} dir - Directory path
   * @returns {Promise<number>} Total size in bytes
   */
  static async getDirectorySize(dir) {
    let totalSize = 0;
    const items = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        totalSize += await this.getDirectorySize(itemPath);
      } else {
        const stats = await fs.promises.stat(itemPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
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
      const totalSize = await this.getDirectorySize(sourceDir);
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
