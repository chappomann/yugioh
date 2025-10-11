/**
 * Yu-Gi-Oh Card Image Download Utility
 * 
 * This module provides dedicated functionality for downloading and managing Yu-Gi-Oh card images.
 * 
 * Features:
 * - Downloads card images from URLs with retry logic
 * - Batch processing with concurrent download limits
 * - Cross-platform image downloading with error handling
 * - Progress tracking and statistics
 * - Configurable retry attempts and delays
 * - Image file validation and duplicate detection
 * 
 * Usage:
 * - Module: `import { ImageDownloader } from './helpers/image-downloader.js'`
 * 
 * The ImageDownloader class handles:
 * - Individual image downloads with retry logic
 * - Batch image downloads with concurrency control
 * - Image directory management and statistics
 * - Error handling and progress reporting
 */

import fs from 'fs/promises';
import path from 'path';

export interface ImageDownloadConfig {
    enabled: boolean;
    concurrentLimit: number;
    retryAttempts: number;
    delayBetweenDownloads: number;
    imagesDirectory: string;
}

export interface ImageDownloadResult {
    success: boolean;
    cardId: string;
    imageUrl: string;
    filePath?: string;
    error?: string;
}

export interface ImageBatchResult {
    downloaded: number;
    errors: number;
    skipped: number;
    results: ImageDownloadResult[];
}

export interface ImageStats {
    totalImages: number;
    totalSize: string;
    totalSizeBytes: number;
}

export class ImageDownloader {
    private config: ImageDownloadConfig;

    constructor(config?: Partial<ImageDownloadConfig>) {
        this.config = {
            enabled: true,
            concurrentLimit: 100,
            retryAttempts: 1,
            delayBetweenDownloads: 100,
            imagesDirectory: path.join(process.cwd(), 'public/images'),
            ...config
        };
    }

    /**
     * Download a single card image with retry logic
     */
    async downloadCardImage(cardId: string, imageUrl: string): Promise<ImageDownloadResult> {
        if (!this.config.enabled) {
            return {
                success: false,
                cardId,
                imageUrl,
                error: 'Image downloading is disabled'
            };
        }

        const fileName = `${cardId}.jpg`;
        const filePath = path.join(this.config.imagesDirectory, fileName);

        // Check if image already exists
        try {
            await fs.access(filePath);
            return {
                success: true,
                cardId,
                imageUrl,
                filePath,
                error: 'Image already exists (skipped)'
            };
        } catch {
            // Image doesn't exist, proceed with download
        }

        // Ensure images directory exists
        await fs.mkdir(this.config.imagesDirectory, { recursive: true });

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await fetch(imageUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const buffer = await response.arrayBuffer();
                await fs.writeFile(filePath, Buffer.from(buffer));

                return {
                    success: true,
                    cardId,
                    imageUrl,
                    filePath
                };
            } catch (error) {
                lastError = error as Error;

                if (attempt < this.config.retryAttempts) {
                    // Wait before retrying
                    await this.delay(this.config.delayBetweenDownloads * attempt);
                }
            }
        }

        // If we get here, all retries failed
        return {
            success: false,
            cardId,
            imageUrl,
            error: lastError?.message || 'Failed to download image after all retries'
        };
    }

    /**
     * Download multiple card images with concurrency control
     */
    async downloadCardImages(
        cards: Array<{ cardId: string; imageUrl: string }>,
        onProgress?: (completed: number, total: number) => void
    ): Promise<ImageBatchResult> {
        if (!this.config.enabled) {
            return {
                downloaded: 0,
                errors: cards.length,
                skipped: 0,
                results: cards.map(card => ({
                    success: false,
                    cardId: card.cardId,
                    imageUrl: card.imageUrl,
                    error: 'Image downloading is disabled'
                }))
            };
        }

        const results: ImageDownloadResult[] = [];
        let downloaded = 0;
        let errors = 0;
        let skipped = 0;

        // Process cards in batches to respect concurrency limits
        for (let i = 0; i < cards.length; i += this.config.concurrentLimit) {
            const batch = cards.slice(i, i + this.config.concurrentLimit);

            const batchPromises = batch.map(card =>
                this.downloadCardImage(card.cardId, card.imageUrl)
            );

            const batchResults = await Promise.all(batchPromises);

            for (const result of batchResults) {
                results.push(result);

                if (result.success) {
                    if (result.error === 'Image already exists (skipped)') {
                        skipped++;
                    } else {
                        downloaded++;
                    }
                } else {
                    errors++;
                }
            }

            // Report progress
            if (onProgress) {
                onProgress(results.length, cards.length);
            }

            // Add delay between batches
            if (i + this.config.concurrentLimit < cards.length) {
                await this.delay(this.config.delayBetweenDownloads);
            }
        }

        return {
            downloaded,
            errors,
            skipped,
            results
        };
    }

    /**
     * Get statistics about downloaded images
     */
    async getImageStats(): Promise<ImageStats> {
        try {
            const files = await fs.readdir(this.config.imagesDirectory);
            const imageFiles = files.filter(file =>
                file.endsWith('.jpg') ||
                file.endsWith('.jpeg') ||
                file.endsWith('.png') ||
                file.endsWith('.gif')
            );

            let totalSize = 0;
            for (const file of imageFiles) {
                try {
                    const filePath = path.join(this.config.imagesDirectory, file);
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                } catch (error) {
                    // Skip files that can't be accessed
                    console.warn(`Could not access image file: ${file}`);
                }
            }

            return {
                totalImages: imageFiles.length,
                totalSize: this.formatBytes(totalSize),
                totalSizeBytes: totalSize
            };
        } catch (error) {
            console.error('Error getting image stats:', error);
            return {
                totalImages: 0,
                totalSize: '0 B',
                totalSizeBytes: 0
            };
        }
    }

    /**
     * Check if an image exists for a given card ID
     */
    async imageExists(cardId: string): Promise<boolean> {
        const fileName = `${cardId}.jpg`;
        const filePath = path.join(this.config.imagesDirectory, fileName);

        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the path to an image for a given card ID
     */
    getImagePath(cardId: string): string {
        const fileName = `${cardId}.jpg`;
        return path.join(this.config.imagesDirectory, fileName);
    }

    /**
     * Delete an image for a given card ID
     */
    async deleteImage(cardId: string): Promise<boolean> {
        try {
            const filePath = this.getImagePath(cardId);
            await fs.unlink(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clean up orphaned images (images without corresponding cards in database)
     */
    async cleanupOrphanedImages(validCardIds: string[]): Promise<{ deleted: number; errors: number }> {
        try {
            const files = await fs.readdir(this.config.imagesDirectory);
            const imageFiles = files.filter(file =>
                file.endsWith('.jpg') ||
                file.endsWith('.jpeg') ||
                file.endsWith('.png') ||
                file.endsWith('.gif')
            );

            let deleted = 0;
            let errors = 0;

            for (const file of imageFiles) {
                // Extract card ID from filename (assuming format: cardId.extension)
                const cardId = path.parse(file).name;

                if (!validCardIds.includes(cardId)) {
                    try {
                        const filePath = path.join(this.config.imagesDirectory, file);
                        await fs.unlink(filePath);
                        deleted++;
                        console.log(`Deleted orphaned image: ${file}`);
                    } catch (error) {
                        errors++;
                        console.error(`Failed to delete orphaned image ${file}:`, error);
                    }
                }
            }

            return { deleted, errors };
        } catch (error) {
            console.error('Error during image cleanup:', error);
            return { deleted: 0, errors: 1 };
        }
    }

    /**
     * Get configuration
     */
    getConfig(): ImageDownloadConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ImageDownloadConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
