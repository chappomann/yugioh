/**
 * Database Initialization Utility
 * 
 * Handles database setup, table creation, and initial configuration.
 * Separated from core application logic for better maintainability.
 * 
 * Features:
 * - Database connection management
 * - Table schema creation
 * - Index optimization
 * - Database health checks
 * 
 * Usage:
 * import { DatabaseInitializer } from './utils/database-initializer.js';
 * const initializer = new DatabaseInitializer();
 * await initializer.initializeYugiohDatabase();
 */

import { YugiohDatabase } from '../database.js';

export class DatabaseInitializer {
    private db: YugiohDatabase;

    constructor(dbPath?: string) {
        this.db = new YugiohDatabase(dbPath);
    }

    /**
     * Initialize Yugioh database with all required tables and indexes
     */
    async initializeYugiohDatabase(): Promise<void> {
        try {
            console.log('Initializing Yugioh database...');
            await this.db.initializeTables('yugioh');
            await this.createOptimizedIndexes();
            await this.verifyDatabaseHealth();
            console.log('Yugioh database initialization completed successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create optimized indexes for better query performance
     */
    private async createOptimizedIndexes(): Promise<void> {
        console.log('Creating optimized database indexes...');

        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_cards_name_search ON cards(name COLLATE NOCASE)',
            'CREATE INDEX IF NOT EXISTS idx_cards_type_filter ON cards(type)',
            'CREATE INDEX IF NOT EXISTS idx_cards_attribute_filter ON cards(attribute)',
            'CREATE INDEX IF NOT EXISTS idx_cards_race_filter ON cards(race)',
            'CREATE INDEX IF NOT EXISTS idx_cards_level_range ON cards(level)',
            'CREATE INDEX IF NOT EXISTS idx_cards_atk_range ON cards(atk)',
            'CREATE INDEX IF NOT EXISTS idx_cards_def_range ON cards(def)',
            'CREATE INDEX IF NOT EXISTS idx_cards_quantity_owned ON cards(quantity) WHERE quantity > 0',
            'CREATE INDEX IF NOT EXISTS idx_cards_archetype_group ON cards(archetype)',
            'CREATE INDEX IF NOT EXISTS idx_cards_price_range ON cards(price) WHERE price IS NOT NULL'
        ];

        for (const indexSql of indexes) {
            await this.db.run(indexSql);
        }

        console.log(`Created ${indexes.length} optimized indexes`);
    }

    /**
     * Verify database health and structure
     */
    private async verifyDatabaseHealth(): Promise<void> {
        console.log('Verifying database health...');

        // Check if main table exists and has expected structure
        const tableInfo = await this.db.all("PRAGMA table_info(cards)");
        const expectedColumns = ['card_id', 'name', 'type', 'race', 'quantity'];

        for (const column of expectedColumns) {
            const exists = tableInfo.some((info: any) => info.name === column);
            if (!exists) {
                throw new Error(`Required column '${column}' missing from cards table`);
            }
        }

        // Test basic operations
        await this.db.get("SELECT COUNT(*) as count FROM cards");
        console.log('Database health check passed');
    }

    /**
     * Get database connection for external use
     */
    getDatabase(): YugiohDatabase {
        return this.db;
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        await this.db.close();
    }
}