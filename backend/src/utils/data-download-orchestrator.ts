/**
 * Data Download Orchestrator
 * 
 * Manages all external data download operations.
 * Separated from business logic for better maintainability and testing.
 * 
 * Features:
 * - API data fetching
 * - Data caching strategies
 * - Download progress tracking
 * - Error handling and retries
 * 
 * Usage:
 * import { DataDownloadOrchestrator } from './utils/data-download-orchestrator.js';
 * const downloader = new DataDownloadOrchestrator();
 * await downloader.downloadAllCardData();
 */

import { CardDataDownloader } from './card-data-downloader.js';
import { ImageDownloader, ImageDownloadConfig } from './image-downloader.js';
import { YugiohApiResponse, CardData } from '../types/shared.js';

export interface DownloadConfig {
    enableImageDownload: boolean;
    imageConfig?: Partial<ImageDownloadConfig>;
    skipExistingImages: boolean;
    batchSize: number;
}

export interface DownloadResult {
    cardDataDownloaded: boolean;
    cardCount: number;
    imagesDownloaded: number;
    imageErrors: number;
    totalDownloadTime: number;
}

export class DataDownloadOrchestrator {
    private cardDownloader: CardDataDownloader;
    private imageDownloader: ImageDownloader;
    private config: DownloadConfig;

    constructor(config?: Partial<DownloadConfig>) {
        this.config = {
            enableImageDownload: true,
            skipExistingImages: true,
            batchSize: 100,
            ...config
        };

        this.cardDownloader = new CardDataDownloader();
        this.imageDownloader = new ImageDownloader(this.config.imageConfig);
    }

    /**
     * Download all card data and images
     */
    async downloadAllCardData(): Promise<DownloadResult> {
        const startTime = Date.now();
        console.log('Starting complete data download process...');

        try {
            // Step 1: Download card data from API
            console.log('Phase 1: Downloading card data from YGOPRODeck API...');
            const cardData = await this.cardDownloader.downloadFreshCardData();
            console.log(`Downloaded ${cardData.data.length} cards from API`);

            let imagesDownloaded = 0;
            let imageErrors = 0;

            // Step 2: Download images if enabled
            if (this.config.enableImageDownload && cardData.data.length > 0) {
                console.log('Phase 2: Starting image download process...');
                const imageResult = await this.downloadCardImages(cardData);
                imagesDownloaded = imageResult.imagesDownloaded;
                imageErrors = imageResult.imageErrors;
            }

            const totalTime = Date.now() - startTime;

            const result: DownloadResult = {
                cardDataDownloaded: true,
                cardCount: cardData.data.length,
                imagesDownloaded,
                imageErrors,
                totalDownloadTime: totalTime
            };

            console.log('Download process completed:', result);
            return result;

        } catch (error) {
            console.error('Download process failed:', error);
            throw error;
        }
    }

    /**
     * Download only card data (no images)
     */
    async downloadCardDataOnly(): Promise<YugiohApiResponse> {
        console.log('Downloading card data only...');
        return await this.cardDownloader.downloadFreshCardData();
    }

    /**
     * Download images for existing card data
     */
    async downloadImagesOnly(): Promise<{ imagesDownloaded: number; imageErrors: number }> {
        console.log('Loading existing card data for image download...');
        const cardData = await this.cardDownloader.loadCardData();
        return await this.downloadCardImages(cardData);
    }

    /**
     * Search and download specific card by name
     */
    async downloadSpecificCard(cardName: string): Promise<CardData | null> {
        console.log(`Searching for card: ${cardName}`);
        return await this.cardDownloader.searchCardByName(cardName);
    }

    /**
     * Private method to handle image downloads
     */
    private async downloadCardImages(cardData: YugiohApiResponse): Promise<{ imagesDownloaded: number; imageErrors: number }> {
        const imageCards = cardData.data
            .filter((card: CardData) => card.id && this.getImageUrl(card))
            .map((card: CardData) => ({
                cardId: card.id!.toString(),
                imageUrl: this.getImageUrl(card)!
            }));

        if (imageCards.length === 0) {
            console.log('No cards with valid image URLs found');
            return { imagesDownloaded: 0, imageErrors: 0 };
        }

        console.log(`Starting download of ${imageCards.length} card images...`);

        const imageResult = await this.imageDownloader.downloadCardImages(
            imageCards,
            (completed, total) => {
                if (completed % 100 === 0 || completed === total) {
                    console.log(`Image progress: ${completed}/${total}`);
                }
            }
        );

        console.log(`Image downloads complete: ${imageResult.downloaded} downloaded, ${imageResult.errors} errors, ${imageResult.skipped} skipped`);

        return {
            imagesDownloaded: imageResult.downloaded,
            imageErrors: imageResult.errors
        };
    }

    /**
     * Get image URL from card data
     */
    private getImageUrl(card: CardData): string | null {
        if (card.card_images && card.card_images.length > 0) {
            return card.card_images[0].image_url || card.card_images[0].image_url_small || null;
        }

        if (card.id) {
            return `https://images.ygoprodeck.com/images/cards/cards_small/${card.id}.jpg`;
        }

        return null;
    }

    /**
     * Get download statistics
     */
    async getDownloadStats(): Promise<{
        cardDataExists: boolean;
        cardCount: number;
        imageStats: any;
    }> {
        try {
            const cardData = await this.cardDownloader.loadCardData();
            const imageStats = await this.imageDownloader.getImageStats();

            return {
                cardDataExists: true,
                cardCount: cardData.data.length,
                imageStats
            };
        } catch (error) {
            return {
                cardDataExists: false,
                cardCount: 0,
                imageStats: { totalImages: 0, totalSize: '0 B', totalSizeBytes: 0 }
            };
        }
    }

    /**
     * Clean up orphaned images
     */
    async cleanupOrphanedImages(validCardIds: string[]): Promise<{ deleted: number; errors: number }> {
        return await this.imageDownloader.cleanupOrphanedImages(validCardIds);
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<DownloadConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (newConfig.imageConfig) {
            this.imageDownloader.updateConfig(newConfig.imageConfig);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): DownloadConfig {
        return { ...this.config };
    }
}