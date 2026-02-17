/**
 * Archive Creator (7z - Single File)
 * Creates 7z archives from downloaded images
 * Handles both single and multi-gallery archives
 * Outputs single file (no splitting) for direct download
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');
const FileManager = require('../utils/fileManager');

class ZipCreator {
  /**
   * Create 7z archive using 7z command (single file, no split)
   * @param {string} sourceDir - Source directory to archive
   * @param {string} outputPath - Output archive file path
   * @returns {Promise<string>} Path to created file
   */
  static async createArchive(sourceDir, outputPath) {
    try {
      Logger.info(`Creating 7z archive: ${path.basename(outputPath)}`);
      
      // Ensure output path ends with .7z
      if (!outputPath.endsWith('.7z')) {
        outputPath = `${outputPath}.7z`;
      }
      
      const command = `7z a -t7z "${outputPath}" "${sourceDir}"/*`;
      
      Logger.debug(`Executing: ${command}`);
      execSync(command, { stdio: 'pipe' });
      
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        Logger.info(`Archive created successfully: ${FileManager.formatBytes(stats.size)}`);
        return outputPath;
      } else {
        throw new Error('Archive file was not created');
      }
      
    } catch (error) {
      Logger.error('Failed to create archive', { error: error.message });
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
   * @returns {Promise<string>} Path to created archive
   */
  static async createSingleGalleryZip(galleryDir, galleryName) {
    try {
      const archiveFilename = `${galleryName}_${Date.now()}.7z`;
      const archivePath = path.join(path.dirname(galleryDir), archiveFilename);

      return await this.createArchive(galleryDir, archivePath);
    } catch (error) {
      Logger.error('Failed to create single gallery archive', { error: error.message });
      throw error;
    }
  }

  /**
   * Create archive from multiple galleries
   * @param {string} baseDir - Base directory containing gallery folders
   * @param {string} modelName - Model name for archive filename
   * @returns {Promise<string>} Path to created archive
   */
  static async createMultiGalleryZip(baseDir, modelName) {
    try {
      const archiveFilename = `${modelName}_galleries_${Date.now()}.7z`;
      const archivePath = path.join(path.dirname(baseDir), archiveFilename);

      return await this.createArchive(baseDir, archivePath);
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
