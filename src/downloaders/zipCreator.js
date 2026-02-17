/**
 * Archive Creator (7z volumes)
 * Creates 7z multi-volume archives from downloaded images
 * Handles both single and multi-gallery archives
 * Uses 7z format for true WinRAR/7-Zip compatibility
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
   * Create 7z archive using 7z command with optional splitting
   * @param {string} sourceDir - Source directory to archive
   * @param {string} outputPath - Output archive file path
   * @param {boolean} enableSplit - Enable multi-volume splitting
   * @returns {Promise<Array>} Array of created file paths
   */
  static async createArchiveWithCommand(sourceDir, outputPath, enableSplit = false) {
    try {
      const outputDir = path.dirname(outputPath);
      const outputName = path.basename(outputPath, '.7z');
      const archivePath = path.join(outputDir, `${outputName}.7z`);
      
      Logger.info(`Creating 7z archive: ${path.basename(archivePath)}`);
      
      let command;
      
      if (enableSplit) {
        // Create multi-volume 7z archive (compatible with WinRAR/7-Zip)
        // Format: archive.7z.001, archive.7z.002, archive.7z.003...
        command = `7z a -t7z -v${MAX_FILE_SIZE_MB}m "${archivePath}" "${sourceDir}"/*`;
        Logger.info(`Creating multi-volume 7z with ${MAX_FILE_SIZE_MB}MB parts`);
      } else {
        // Create regular 7z archive
        command = `7z a -t7z "${archivePath}" "${sourceDir}"/*`;
      }
      
      Logger.debug(`Executing: ${command}`);
      execSync(command, { stdio: 'pipe' });
      
      // Find all created files
      const createdFiles = [];
      
      if (enableSplit) {
        // Multi-volume: find .7z.001, .7z.002, .7z.003, etc.
        let volumeIndex = 1;
        while (true) {
          const volumePath = `${archivePath}.${String(volumeIndex).padStart(3, '0')}`;
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
        if (fs.existsSync(archivePath)) {
          createdFiles.push(archivePath);
          const stats = fs.statSync(archivePath);
          Logger.info(`Archive created successfully: ${FileManager.formatBytes(stats.size)}`);
        }
      }
      
      return createdFiles;
      
    } catch (error) {
      Logger.error('Failed to create archive', { error: error.message });
      throw error;
    }
  }

  /**
   * Create archive and split if necessary
   * @param {string} sourceDir - Source directory
   * @param {string} outputPath - Output archive path
   * @returns {Promise<Array>} Array of file paths (single or multiple volumes)
   */
  static async createAndSplitIfNeeded(sourceDir, outputPath) {
    try {
      // Get estimated size first
      const estimatedSize = await this.getDirectorySize(sourceDir);
      // 7z typically achieves better compression than ZIP (especially for images)
      // But we'll use conservative estimate
      const estimatedArchiveSize = estimatedSize * 0.90;
      const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (estimatedArchiveSize > maxSizeBytes) {
        Logger.info(
          `Estimated archive size (${FileManager.formatBytes(estimatedArchiveSize)}) exceeds limit, ` +
          `creating multi-volume archive...`
        );
        return await this.createArchiveWithCommand(sourceDir, outputPath, true);
      } else {
        Logger.info('Estimated archive size within limits, creating single file');
        return await this.createArchiveWithCommand(sourceDir, outputPath, false);
      }
      
    } catch (error) {
      Logger.error('Failed to create and split archive', { error: error.message });
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
   * Create archive from single gallery
   * @param {string} galleryDir - Gallery directory
   * @param {string} galleryName - Gallery name for archive filename
   * @returns {Promise<Array>} Array of file paths
   */
  static async createSingleGalleryZip(galleryDir, galleryName) {
    try {
      const archiveFilename = `${galleryName}_${Date.now()}.7z`;
      const archivePath = path.join(path.dirname(galleryDir), archiveFilename);

      return await this.createAndSplitIfNeeded(galleryDir, archivePath);
    } catch (error) {
      Logger.error('Failed to create single gallery archive', { error: error.message });
      throw error;
    }
  }

  /**
   * Create archive from multiple galleries
   * @param {string} baseDir - Base directory containing gallery folders
   * @param {string} modelName - Model name for archive filename
   * @returns {Promise<Array>} Array of file paths
   */
  static async createMultiGalleryZip(baseDir, modelName) {
    try {
      const archiveFilename = `${modelName}_galleries_${Date.now()}.7z`;
      const archivePath = path.join(path.dirname(baseDir), archiveFilename);

      return await this.createAndSplitIfNeeded(baseDir, archivePath);
    } catch (error) {
      Logger.error('Failed to create multi-gallery archive', { error: error.message });
      throw error;
    }
  }

  /**
   * Get estimated archive size (approximate)
   * @param {string} sourceDir - Source directory
   * @returns {Promise<string>} Estimated size in human-readable format
   */
  static async getEstimatedSize(sourceDir) {
    try {
      const totalSize = await this.getDirectorySize(sourceDir);
      // 7z compression for images typically achieves 5-15% reduction
      const estimatedArchiveSize = totalSize * 0.90;

      return FileManager.formatBytes(estimatedArchiveSize);
    } catch (error) {
      Logger.error('Failed to estimate archive size', { error: error.message });
      return 'Unknown';
    }
  }
}

module.exports = ZipCreator;
