/**
 * Yu-Gi-Oh Database Importer
 * 
 * Handles importing card data into the SQLite database with normalization.
 * This module is focused solely on database operations and data transformation.
 * 
 * Features:
 * - Imports card data to SQLite database
 * - Normalizes card data from API format to database schema
 * - Batch processing for memory efficiency
 * - Error handling and progress tracking
 * - Database statistics generation
 * 
 * Usage:
 * import { DatabaseImporter } from './database-importer.js';
 * const importer = new DatabaseImporter();
 * await importer.importCards(cardData);
 */

import { YugiohDatabase } from '../database.js';
import { CardData, YugiohApiResponse, NormalizedCard, ImportResult, ImportStats } from '../types/shared.js';

export class DatabaseImporter {
    private db: YugiohDatabase;

    constructor() {
        this.db = new YugiohDatabase();
    }

    async initializeDatabase(): Promise<void> {
        try {
            await this.db.initializeTables('yugioh');
            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async importCards(cardData: YugiohApiResponse): Promise<ImportResult> {
        try {
            if (!cardData.data || !Array.isArray(cardData.data)) {
                throw new Error('Invalid card data format');
            }

            await this.initializeDatabase();
            console.log(`Starting import of ${cardData.data.length} cards...`);

            let imported = 0;
            let errors = 0;
            let skipped = 0;

            // Process cards in smaller batches and add delays to prevent database locking
            const batchSize = 50; // Reduced batch size
            for (let i = 0; i < cardData.data.length; i += batchSize) {
                const batch = cardData.data.slice(i, i + batchSize);

                for (const card of batch) {
                    try {
                        // Skip cards without valid IDs
                        if (!card.id || card.id === null || card.id === undefined) {
                            console.warn(`Skipping card with no ID: ${card.name || 'Unknown'}`);
                            skipped++;
                            continue;
                        }

                        const normalizedCard = this.normalizeCardData(card);
                        await this.db.addCard(normalizedCard);
                        imported++;

                        if (imported % 500 === 0) {
                            console.log(`Imported ${imported} cards...`);
                        }
                    } catch (error) {
                        console.error(`Error importing card ${card.name || 'Unknown'}:`, (error as Error).message);
                        errors++;
                    }
                }

                // Add a small delay between batches to prevent database locking
                if (i + batchSize < cardData.data.length) {
                    await this.delay(10); // 10ms delay
                }
            }

            console.log(`Import complete! ${imported} cards imported, ${errors} errors, ${skipped} skipped`);
            await this.db.close();

            return { imported, errors };
        } catch (error) {
            console.error('Database import failed:', error);
            throw error;
        }
    }

    async importSingleCard(card: CardData): Promise<NormalizedCard> {
        try {
            const normalizedCard = this.normalizeCardData(card);
            await this.db.addCard(normalizedCard);
            console.log(`Imported card: ${card.name}`);
            return normalizedCard;
        } catch (error) {
            console.error(`Error importing card ${card.name}:`, error);
            throw error;
        }
    }

    async getImportStats(): Promise<ImportStats> {
        try {
            // Ensure connection exists but don't close it
            if (!this.db.isConnected()) {
                await this.db.connect();
            }

            const totalCards = await this.db.get('SELECT COUNT(*) as count FROM cards');
            const cardTypes = await this.db.all(`
                SELECT type, COUNT(*) as count 
                FROM cards 
                WHERE type IS NOT NULL 
                GROUP BY type 
                ORDER BY count DESC
            `);
            const attributes = await this.db.all(`
                SELECT attribute, COUNT(*) as count 
                FROM cards 
                WHERE attribute IS NOT NULL 
                GROUP BY attribute 
                ORDER BY count DESC
            `);

            return {
                totalCards: totalCards.count,
                cardTypes,
                attributes
            };
        } catch (error) {
            console.error('Error getting import stats:', error);
            throw error;
        }
    }

    private normalizeCardData(card: CardData): NormalizedCard {
        // Ensure we have a valid card ID
        if (!card.id || card.id === null || card.id === undefined) {
            throw new Error(`Card has no valid ID: ${card.name || 'Unknown'}`);
        }

        return {
            card_id: card.id.toString(),
            name: card.name || 'Unknown Card',
            type: card.type || null,
            race: card.race || null,
            archetype: card.archetype || null,
            atk: card.atk !== undefined && card.atk !== null ? parseInt(card.atk.toString()) : null,
            def: card.def !== undefined && card.def !== null ? parseInt(card.def.toString()) : null,
            level: card.level !== undefined && card.level !== null ? parseInt(card.level.toString()) : null,
            attribute: card.attribute || null,
            description: card.desc || card.description || '',
            image_url: this.getImageUrl(card),
            price: this.getPrice(card),
            quantity: card.quantity !== undefined ? card.quantity : 0 // Default to 0 if not specified
        };
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

    private getPrice(card: CardData): number | null {
        // Extract price information if available
        if (card.card_prices && card.card_prices.length > 0) {
            const price = card.card_prices[0];
            const priceValue = price.tcgplayer_price || price.cardmarket_price || price.ebay_price;
            return priceValue ? parseFloat(priceValue) : null;
        }
        return null;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
