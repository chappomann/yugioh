/**
 * Yu-Gi-Oh Card Import Service
 * 
 * Simplified card import service that focuses only on business logic.
 * Infrastructure concerns (DB init, downloads, images) are handled by dedicated utilities.
 * 
 * Features:
 * - Card import coordination
 * - Business rule validation
 * - Import result reporting
 * 
 * Usage:
 * import { CardImportService } from './utils/card-importer.js';
 * const service = new CardImportService();
 * await service.importFromAPI();
 */

import { DatabaseImporter } from './database-importer.js';
import { DataDownloadOrchestrator } from './data-download-orchestrator.js';
import { DatabaseInitializer } from './database-initializer.js';
import { ImageManager } from './image-manager.js';
import { YugiohDatabase } from '../database.js';
import { ImportResult, ImportStats } from '../types/shared.js';

export interface ImportOptions {
    downloadFreshData: boolean;
    downloadImages: boolean;
    skipExistingCards: boolean;
    batchSize: number;
}

export class CardImportService {
    private dbImporter: DatabaseImporter;
    private dataOrchestrator: DataDownloadOrchestrator;
    private dbInitializer: DatabaseInitializer;
    private imageManager: ImageManager;
    private db: YugiohDatabase;

    constructor() {
        this.dbImporter = new DatabaseImporter();
        this.dataOrchestrator = new DataDownloadOrchestrator();
        this.dbInitializer = new DatabaseInitializer();
        this.imageManager = new ImageManager();
        this.db = new YugiohDatabase();
    }

    /**
     * Full import process with fresh data from API
     */
    async importFromAPI(options?: Partial<ImportOptions>): Promise<ImportResult> {
        const opts: ImportOptions = {
            downloadFreshData: true,
            downloadImages: true,
            skipExistingCards: false,
            batchSize: 100,
            ...options
        };

        console.log('Starting complete import from API...');

        try {
            // Step 1: Initialize database
            await this.dbInitializer.initializeYugiohDatabase();

            // Step 2: Download fresh data
            const downloadResult = await this.dataOrchestrator.downloadAllCardData();

            // Step 3: Import to database
            const cardData = await this.dataOrchestrator.downloadCardDataOnly();
            const importResult = await this.dbImporter.importCards(cardData);

            console.log('API import completed successfully');

            return {
                imported: importResult.imported,
                errors: importResult.errors,
                imagesDownloaded: downloadResult.imagesDownloaded,
                imageErrors: downloadResult.imageErrors
            };

        } catch (error) {
            console.error('API import failed:', error);
            throw error;
        }
    }

    /**
     * Import from existing local data
     */
    async importFromLocalData(): Promise<ImportResult> {
        console.log('Starting import from local data...');

        try {
            await this.dbInitializer.initializeYugiohDatabase();

            const cardData = await this.dataOrchestrator.downloadCardDataOnly();
            const importResult = await this.dbImporter.importCards(cardData);

            console.log('Local import completed successfully');
            return importResult;

        } catch (error) {
            console.error('Local import failed:', error);
            throw error;
        }
    }

    /**
     * Get import statistics
     */
    async getImportStats(): Promise<ImportStats> {
        return await this.dbImporter.getImportStats();
    }

    /**
     * Cleanup operations
     */
    async performCleanup(): Promise<{ deletedImages: number; errors: number }> {
        try {
            // Get valid card IDs from database
            await this.db.connect();
            const cards = await this.db.all('SELECT card_id FROM cards');
            await this.db.close();

            const validCardIds = cards.map((card: any) => card.card_id);

            // Clean up orphaned images
            const result = await this.imageManager.cleanupOrphanedImages(validCardIds);
            return { deletedImages: result.deleted, errors: result.errors };
        } catch (error) {
            console.error('Cleanup failed:', error);
            return { deletedImages: 0, errors: 1 };
        }
    }

    /**
     * Get comprehensive system stats
     */
    async getSystemStats(): Promise<{
        database: ImportStats;
        downloads: any;
        images: any;
    }> {
        try {
            const [dbStats, downloadStats, imageStats] = await Promise.all([
                this.getImportStats(),
                this.dataOrchestrator.getDownloadStats(),
                this.imageManager.getImageStorageStats()
            ]);

            return {
                database: dbStats,
                downloads: downloadStats,
                images: imageStats
            };
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw error;
        }
    }
}

// --- CLI Support ---
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CLI Entrypoint ---
if (import.meta.url === `file://${process.argv[1]}`) {
    // Usage: tsx card-importer.ts -arg=<functionName>
    const arg = process.argv.find(a => a.startsWith('-arg='))?.split('=')[1];
    const service = new CardImportService();

    // Map CLI arg to function
    const cliFns: Record<string, (...args: any[]) => Promise<any>> = {
        importFromAPI: async () => {
            console.log('Starting fresh card data import from API...');
            const result = await service.importFromAPI();
            console.log('API import completed:', result);
            return result;
        },
        importFromLocal: async () => {
            const result = await service.importFromLocalData();
            console.log('Local import completed:', result);
            return result;
        },
        getImportStats: async () => {
            const stats = await service.getImportStats();
            console.log('Database statistics:', stats);
            return stats;
        },
        getSystemStats: async () => {
            const stats = await service.getSystemStats();
            console.log('System statistics:', stats);
            return stats;
        },
        performCleanup: async () => {
            console.log('Cleaning up orphaned images...');
            const result = await service.performCleanup();
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
        console.log('Usage: tsx card-importer.ts -arg=<functionName>');
        console.log('Available functions:');
        Object.keys(cliFns).forEach(fn => console.log(`  - ${fn}`));
        console.log('Examples:');
        console.log('  tsx card-importer.ts -arg=importFromAPI');
        console.log('  tsx card-importer.ts -arg=importFromLocal');
        console.log('  tsx card-importer.ts -arg=getImportStats');
        console.log('  tsx card-importer.ts -arg=getSystemStats');
        console.log('  tsx card-importer.ts -arg=performCleanup');
        process.exit(0);
    }
}
