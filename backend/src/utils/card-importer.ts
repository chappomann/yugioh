/**
 * Yu-Gi-Oh Card Data Import Orchestrator
 * 
 * This module orchestrates the complete card import process by using dedicated helper modules:
 * - CardDataDownloader: Downloads fresh card data from YGOPRODeck API
 * - DatabaseImporter: Imports and normalizes card data into SQLite
 * - ImageDownloader: Downloads and manages card images
 * 
 * Features:
 * - Coordinates fresh data downloads, database imports, and image downloads
 * - Provides unified interface for all import operations
 * - Can be run as a CLI script or imported as a module
 * - Progress tracking and comprehensive statistics
 * - Error handling and recovery
 * 
 * Usage:
 * - CLI: `npm run db:import` or `npx tsx src/helpers/card-importer.ts`
 * - Module: `import { CardImporter } from './helpers/card-importer.js'`
 * 
 * The CardImporter class orchestrates:
 * - Fresh data downloads via CardDataDownloader
 * - Database imports via DatabaseImporter
 * - Image downloads via ImageDownloader
 * - Statistics collection and reporting
 */

import { CardDataDownloader } from './card-data-downloader.js';
import { DatabaseImporter } from './database-importer.js';
import { ImageDownloader, type ImageDownloadConfig } from './image-downloader.js';
import { YugiohDatabase } from '../database.js';
import { CardData, YugiohApiResponse, NormalizedCard, ImportResult, ImportStats } from '../types/shared.js';
import path from 'path';

export class CardImporter {
    private dataDownloader: CardDataDownloader;
    private dbImporter: DatabaseImporter;
    private imageDownloader: ImageDownloader;
    private db: YugiohDatabase;

    constructor(imageConfig?: Partial<ImageDownloadConfig>) {
        this.dataDownloader = new CardDataDownloader();
        this.dbImporter = new DatabaseImporter();
        this.imageDownloader = new ImageDownloader(imageConfig);
        this.db = new YugiohDatabase();
    }

    /**
     * Download fresh card data from the API
     */
    async downloadFreshCardData(): Promise<YugiohApiResponse> {
        return await this.dataDownloader.downloadFreshCardData();
    }

    /**
     * Import cards from JSON file with optional image downloading
     */
    async importFromJSON(filePath: string, downloadImages: boolean = true): Promise<ImportResult> {
        try {
            console.log('Starting card import process...');

            // Load card data from file
            const cardData = await this.dataDownloader.loadCardData();

            // Import cards to database
            const importResult = await this.dbImporter.importCards(cardData);

            let imagesDownloaded = 0;
            let imageErrors = 0;

            // Download images if requested
            if (downloadImages && cardData.data && cardData.data.length > 0) {
                console.log('Starting image downloads...');

                // Prepare image download data
                const imageCards = cardData.data
                    .filter((card: CardData) => card.id && this.getImageUrl(card))
                    .map((card: CardData) => ({
                        cardId: card.id!.toString(),
                        imageUrl: this.getImageUrl(card)!
                    }));

                if (imageCards.length > 0) {
                    const imageResult = await this.imageDownloader.downloadCardImages(
                        imageCards,
                        (completed, total) => {
                            if (completed % 100 === 0 || completed === total) {
                                console.log(`Image progress: ${completed}/${total}`);
                            }
                        }
                    );

                    imagesDownloaded = imageResult.downloaded;
                    imageErrors = imageResult.errors;

                    console.log(`Image downloads complete: ${imagesDownloaded} downloaded, ${imageErrors} errors, ${imageResult.skipped} skipped`);
                }
            }

            console.log(`Import complete! ${importResult.imported} cards imported, ${importResult.errors} errors`);

            return {
                imported: importResult.imported,
                errors: importResult.errors,
                imagesDownloaded: downloadImages ? imagesDownloaded : undefined,
                imageErrors: downloadImages ? imageErrors : undefined
            };
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    /**
     * Download fresh data and import it to database
     */
    async importFreshData(downloadImages: boolean = true): Promise<ImportResult> {
        try {
            // Download fresh data first
            await this.downloadFreshCardData();

            // Then import it to database with optional image downloading
            const cardDbPath = path.join(process.cwd(), '../../databases/carddb.json');
            return await this.importFromJSON(cardDbPath, downloadImages);
        } catch (error) {
            console.error('Fresh import failed:', error);
            throw error;
        }
    }

    /**
     * Search for a card by name and import it from the API
     */
    async searchAndImportFromAPI(cardName: string, downloadImage: boolean = true): Promise<NormalizedCard | null> {
        try {
            // Search for card data
            const cardData = await this.dataDownloader.searchCardByName(cardName);

            if (cardData) {
                // Import to database
                const normalizedCard = await this.dbImporter.importSingleCard(cardData);
                console.log(`Imported card from API: ${cardData.name}`);

                // Download image if requested and URL exists
                if (downloadImage && normalizedCard.image_url) {
                    const result = await this.imageDownloader.downloadCardImage(
                        normalizedCard.card_id,
                        normalizedCard.image_url
                    );

                    if (result.success) {
                        console.log(`Downloaded image for card: ${cardData.name}`);
                    } else {
                        console.warn(`Failed to download image for card ${cardData.name}: ${result.error}`);
                    }
                }

                return normalizedCard;
            }
            return null;
        } catch (error) {
            console.error(`Error importing card from API: ${cardName}`, error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    async getImportStats(): Promise<ImportStats> {
        return await this.dbImporter.getImportStats();
    }

    /**
     * Get image statistics
     */
    async getImageStats() {
        return await this.imageDownloader.getImageStats();
    }

    /**
     * Clean up orphaned images
     */
    async cleanupOrphanedImages(): Promise<{ deleted: number; errors: number }> {
        try {
            // Get all valid card IDs from database
            await this.db.connect();
            const cards = await this.db.all('SELECT card_id FROM cards');
            await this.db.close();

            const validCardIds = cards.map((card: any) => card.card_id);

            return await this.imageDownloader.cleanupOrphanedImages(validCardIds);
        } catch (error) {
            console.error('Error during cleanup:', error);
            return { deleted: 0, errors: 1 };
        }
    }

    private getImageUrl(card: CardData): string | null {
        // Use the card images from the API or construct URL
        if (card.card_images && card.card_images.length > 0) {
            return card.card_images[0].image_url || card.card_images[0].image_url_small || null;
        }

        // Fallback to constructed URL if we have card ID
        if (card.id) {
            return `https://images.ygoprodeck.com/images/cards/cards_small${card.id}.jpg`;
        }

        return null;
    }
}

// --- CLI Support ---
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CLI Entrypoint ---
if (import.meta.url === `file://${process.argv[1]}`) {
    // Usage: ts-node card-importer.ts -arg=<functionName> [additional args]
    const arg = process.argv.find(a => a.startsWith('-arg='))?.split('=')[1];
    const importer = new CardImporter();

    // Map CLI arg to function
    const cliFns: Record<string, (...args: any[]) => Promise<any>> = {
        importFreshData: async () => {
            console.log('Starting fresh card data import with image downloads...');
            const result = await importer.importFreshData(true);
            console.log('Import completed:', result);
            return result;
        },
        importFromJSON: async () => {
            const filePath = process.argv.find(a => a.startsWith('-file='))?.split('=')[1];
            if (!filePath) {
                throw new Error('Missing -file argument for importFromJSON');
            }
            const result = await importer.importFromJSON(filePath, true);
            console.log('Import from JSON completed:', result);
            return result;
        },
        searchAndImportFromAPI: async () => {
            const cardName = process.argv.find(a => a.startsWith('-name='))?.split('=')[1];
            if (!cardName) {
                throw new Error('Missing -name argument for searchAndImportFromAPI');
            }
            const result = await importer.searchAndImportFromAPI(cardName, true);
            console.log('Searched and imported card:', result);
            return result;
        },
        getImportStats: async () => {
            const stats = await importer.getImportStats();
            console.log('Database statistics:', stats);
            return stats;
        },
        getImageStats: async () => {
            const stats = await importer.getImageStats();
            console.log('Image statistics:', stats);
            return stats;
        },
        cleanupOrphanedImages: async () => {
            console.log('Cleaning up orphaned images...');
            const result = await importer.cleanupOrphanedImages();
            console.log('Cleanup completed:', result);
            return result;
        },
    };

    if (arg && cliFns[arg]) {
        cliFns[arg]()
            .then(() => process.exit(0))
            .catch((error: Error) => {
                console.error(`${arg} failed:`, error);
                process.exit(1);
            });
    } else {
        console.log('Usage: ts-node card-importer.ts -arg=<functionName> [additional args]');
        console.log('Available functions:');
        Object.keys(cliFns).forEach(fn => console.log(`  - ${fn}`));
        console.log('Examples:');
        console.log('  ts-node card-importer.ts -arg=importFreshData');
        console.log('  ts-node card-importer.ts -arg=importFromJSON -file=path/to/file.json');
        console.log('  ts-node card-importer.ts -arg=searchAndImportFromAPI -name="Dark Magician"');
        console.log('  ts-node card-importer.ts -arg=getImportStats');
        console.log('  ts-node card-importer.ts -arg=getImageStats');
        console.log('  ts-node card-importer.ts -arg=cleanupOrphanedImages');
        process.exit(0);
    }
}
