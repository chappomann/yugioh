/**
 * Image Management Utility
 * 
 * Centralized image operations separated from download logic.
 * Handles image storage, validation, and maintenance operations.
 * 
 * Features:
 * - Image file management
 * - Storage optimization
 * - Image validation
 * - Cleanup operations
 * 
 * Usage:
 * import { ImageManager } from './utils/image-manager.js';
 * const imageManager = new ImageManager();
 * await imageManager.optimizeImageStorage();
 */

import fs from 'fs/promises';
import path from 'path';

export interface ImageInfo {
    cardId: string;
    fileName: string;
    filePath: string;
    size: number;
    exists: boolean;
}

export interface ImageStorageStats {
    totalImages: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    averageImageSize: number;
    largestImage: ImageInfo | null;
    orphanedImages: string[];
}

export class ImageManager {
    private imagesDirectory: string;

    constructor(imagesDirectory?: string) {
        this.imagesDirectory = imagesDirectory ||
            process.env.IMAGES_DIRECTORY ||
            path.join(process.cwd(), 'public/images');
    }

    /**
     * Get comprehensive image storage statistics
     */
    async getImageStorageStats(validCardIds?: string[]): Promise<ImageStorageStats> {
        try {
            await fs.mkdir(this.imagesDirectory, { recursive: true });
            const files = await fs.readdir(this.imagesDirectory);
            const imageFiles = files.filter(file => this.isImageFile(file));

            let totalSize = 0;
            let largestImage: ImageInfo | null = null;
            const imageInfos: ImageInfo[] = [];
            const orphanedImages: string[] = [];

            for (const file of imageFiles) {
                const filePath = path.join(this.imagesDirectory, file);
                const cardId = path.parse(file).name;

                try {
                    const stats = await fs.stat(filePath);
                    const imageInfo: ImageInfo = {
                        cardId,
                        fileName: file,
                        filePath,
                        size: stats.size,
                        exists: true
                    };

                    imageInfos.push(imageInfo);
                    totalSize += stats.size;

                    if (!largestImage || stats.size > largestImage.size) {
                        largestImage = imageInfo;
                    }

                    // Check if image is orphaned (if validCardIds provided)
                    if (validCardIds && !validCardIds.includes(cardId)) {
                        orphanedImages.push(file);
                    }
                } catch (error) {
                    console.warn(`Error reading image file ${file}:`, error);
                }
            }

            return {
                totalImages: imageInfos.length,
                totalSizeBytes: totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                averageImageSize: imageInfos.length > 0 ? Math.round(totalSize / imageInfos.length) : 0,
                largestImage,
                orphanedImages
            };
        } catch (error) {
            console.error('Error getting image storage stats:', error);
            return {
                totalImages: 0,
                totalSizeBytes: 0,
                totalSizeFormatted: '0 B',
                averageImageSize: 0,
                largestImage: null,
                orphanedImages: []
            };
        }
    }

    /**
     * Check if a specific image exists
     */
    async imageExists(cardId: string): Promise<boolean> {
        const filePath = this.getImagePath(cardId);
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the full path for a card image
     */
    getImagePath(cardId: string): string {
        return path.join(this.imagesDirectory, `${cardId}.jpg`);
    }

    /**
     * Get image info for a specific card
     */
    async getImageInfo(cardId: string): Promise<ImageInfo | null> {
        const filePath = this.getImagePath(cardId);
        const fileName = `${cardId}.jpg`;

        try {
            const stats = await fs.stat(filePath);
            return {
                cardId,
                fileName,
                filePath,
                size: stats.size,
                exists: true
            };
        } catch {
            return {
                cardId,
                fileName,
                filePath,
                size: 0,
                exists: false
            };
        }
    }

    /**
     * Delete a specific image
     */
    async deleteImage(cardId: string): Promise<boolean> {
        try {
            const filePath = this.getImagePath(cardId);
            await fs.unlink(filePath);
            console.log(`Deleted image for card: ${cardId}`);
            return true;
        } catch (error) {
            console.warn(`Failed to delete image for card ${cardId}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple images
     */
    async deleteImages(cardIds: string[]): Promise<{ deleted: number; errors: number }> {
        let deleted = 0;
        let errors = 0;

        for (const cardId of cardIds) {
            const success = await this.deleteImage(cardId);
            if (success) {
                deleted++;
            } else {
                errors++;
            }
        }

        return { deleted, errors };
    }

    /**
     * Clean up orphaned images (images without corresponding cards)
     */
    async cleanupOrphanedImages(validCardIds: string[]): Promise<{ deleted: number; errors: number }> {
        try {
            const stats = await this.getImageStorageStats(validCardIds);
            console.log(`Found ${stats.orphanedImages.length} orphaned images`);

            if (stats.orphanedImages.length === 0) {
                return { deleted: 0, errors: 0 };
            }

            const orphanedCardIds = stats.orphanedImages.map(fileName => path.parse(fileName).name);
            return await this.deleteImages(orphanedCardIds);
        } catch (error) {
            console.error('Error during orphaned image cleanup:', error);
            return { deleted: 0, errors: 1 };
        }
    }

    /**
     * Validate image directory structure
     */
    async validateImageDirectory(): Promise<{
        directoryExists: boolean;
        isWritable: boolean;
        imageCount: number;
        issues: string[];
    }> {
        const issues: string[] = [];

        try {
            // Check if directory exists
            await fs.access(this.imagesDirectory);
        } catch {
            try {
                await fs.mkdir(this.imagesDirectory, { recursive: true });
                console.log(`Created images directory: ${this.imagesDirectory}`);
            } catch (error) {
                issues.push(`Cannot create images directory: ${error}`);
                return {
                    directoryExists: false,
                    isWritable: false,
                    imageCount: 0,
                    issues
                };
            }
        }

        // Check if writable
        let isWritable = true;
        try {
            const testFile = path.join(this.imagesDirectory, '.write-test');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
        } catch (error) {
            isWritable = false;
            issues.push(`Images directory is not writable: ${error}`);
        }

        // Count images
        let imageCount = 0;
        try {
            const files = await fs.readdir(this.imagesDirectory);
            imageCount = files.filter(file => this.isImageFile(file)).length;
        } catch (error) {
            issues.push(`Cannot read images directory: ${error}`);
        }

        return {
            directoryExists: true,
            isWritable,
            imageCount,
            issues
        };
    }

    /**
     * Get images directory path
     */
    getImagesDirectory(): string {
        return this.imagesDirectory;
    }

    /**
     * Update images directory path
     */
    setImagesDirectory(newPath: string): void {
        this.imagesDirectory = newPath;
    }

    /**
     * Check if file is an image based on extension
     */
    private isImageFile(fileName: string): boolean {
        const ext = path.extname(fileName).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }

    /**
     * Format bytes to human readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}