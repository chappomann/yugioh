import { DatabaseUtils } from './utils/database-utils.js';
import path from 'path';

interface DatabaseResult {
    id?: number;
    changes?: number;
}

interface Card {
    id?: number;
    card_id: string;
    name: string;
    type: string | null;
    race: string | null;
    archetype: string | null;
    atk: number | null;
    def: number | null;
    level: number | null;
    attribute: string | null;
    description: string;
    image_url: string | null;
    price: number | null;
    quantity: number; // Added quantity field
    created_at?: string;
    updated_at?: string;
}

interface CollectionItem {
    id?: number;
    card_id: string;
    quantity: number;
    condition: string;
    acquired_date?: string;
    notes?: string;
    created_at?: string;
}

interface CollectionWithCard extends Card {
    quantity: number;
    condition: string;
    acquired_date: string;
    notes: string;
    collection_id: number;
}

interface Deck {
    id?: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    card_count?: number;
}

interface DeckWithCards extends Deck {
    cards: Array<Card & { quantity: number }>;
}

interface SearchFilters {
    search?: string;
    type?: string;
    race?: string;
    attribute?: string;
    archetype?: string;
    minAtk?: number | null;
    maxAtk?: number | null;
    minDef?: number | null;
    maxDef?: number | null;
    level?: number | null;
}

interface FilterOptions {
    types: string[];
    races: string[];
    attributes: string[];
    archetypes: string[];
    levels: number[];
}

interface CollectionStats {
    totalUniqueCards: number;
    totalCards: number;
    totalValue: number;
    conditionBreakdown: Array<{ condition: string; count: number; total_quantity: number }>;
    typeBreakdown: Array<{ type: string; count: number; total_quantity: number }>;
}

export class YugiohDatabase extends DatabaseUtils {
    constructor() {
        const dbPath = path.join(process.cwd(), '../../../databases/yugioh.sqlite');
        super(dbPath);
    }

    // Ensure database is connected before operations
    private async ensureConnected(): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
        }
    }

    // Override database methods to ensure connection
    async run(sql: string, params: any[] = []): Promise<any> {
        await this.ensureConnected();
        return super.run(sql, params);
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        await this.ensureConnected();
        return super.get(sql, params);
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        await this.ensureConnected();
        return super.all(sql, params);
    }

    // Enhanced card management methods
    async addCard(cardData: Omit<Card, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
        const {
            card_id, name, type, race, archetype, atk, def, level,
            attribute, description, image_url, price, quantity
        } = cardData;

        return await this.run(`
            INSERT OR REPLACE INTO cards 
            (card_id, name, type, race, archetype, atk, def, level, attribute, description, image_url, price, quantity, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [card_id, name, type, race, archetype, atk, def, level, attribute, description, image_url, price, quantity]);
    }

    async getCardById(cardId: string): Promise<Card | null> {
        return await this.get(`SELECT * FROM cards WHERE card_id = ?`, [cardId]);
    }

    async updateCardQuantity(cardId: string, quantity: number): Promise<DatabaseResult> {
        return await this.run(`UPDATE cards SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE card_id = ?`, [quantity, cardId]);
    }

    async searchCardsAdvanced(
        filters: SearchFilters,
        limit: number = 50,
        offset: number = 0,
        sortBy: string = 'name',
        sortOrder: string = 'ASC'
    ): Promise<Card[]> {
        let query = `SELECT * FROM cards WHERE 1=1`;
        const params: any[] = [];

        if (filters.search) {
            query += ` AND (name LIKE ? OR description LIKE ? OR archetype LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }
        if (filters.race) {
            query += ` AND race = ?`;
            params.push(filters.race);
        }
        if (filters.attribute) {
            query += ` AND attribute = ?`;
            params.push(filters.attribute);
        }
        if (filters.archetype) {
            query += ` AND archetype = ?`;
            params.push(filters.archetype);
        }
        if (filters.minAtk !== null && filters.minAtk !== undefined) {
            query += ` AND atk >= ?`;
            params.push(filters.minAtk);
        }
        if (filters.maxAtk !== null && filters.maxAtk !== undefined) {
            query += ` AND atk <= ?`;
            params.push(filters.maxAtk);
        }
        if (filters.minDef !== null && filters.minDef !== undefined) {
            query += ` AND def >= ?`;
            params.push(filters.minDef);
        }
        if (filters.maxDef !== null && filters.maxDef !== undefined) {
            query += ` AND def <= ?`;
            params.push(filters.maxDef);
        }
        if (filters.level !== null && filters.level !== undefined) {
            query += ` AND level = ?`;
            params.push(filters.level);
        }

        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return await this.all(query, params);
    }

    async getAllCards(limit: number = 100, offset: number = 0, sortBy: string = 'name', sortOrder: string = 'ASC'): Promise<Card[]> {
        return await this.all(`
            SELECT * FROM cards 
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [limit, offset]);
    }

    async getFilterOptions(): Promise<FilterOptions> {
        const types = await this.all(`
            SELECT DISTINCT type FROM cards 
            WHERE type IS NOT NULL 
            ORDER BY type
        `);

        const races = await this.all(`
            SELECT DISTINCT race FROM cards 
            WHERE race IS NOT NULL 
            ORDER BY race
        `);

        const attributes = await this.all(`
            SELECT DISTINCT attribute FROM cards 
            WHERE attribute IS NOT NULL 
            ORDER BY attribute
        `);

        const archetypes = await this.all(`
            SELECT DISTINCT archetype FROM cards 
            WHERE archetype IS NOT NULL 
            ORDER BY archetype
        `);

        const levels = await this.all(`
            SELECT DISTINCT level FROM cards 
            WHERE level IS NOT NULL 
            ORDER BY level
        `);

        return {
            types: types.map((t: any) => t.type),
            races: races.map((r: any) => r.race),
            attributes: attributes.map((a: any) => a.attribute),
            archetypes: archetypes.map((a: any) => a.archetype),
            levels: levels.map((l: any) => l.level)
        };
    }

    // Collection management methods (now based on cards table)
    async addToCollection(cardId: string, quantity: number = 1): Promise<any> {
        // Set quantity for the card (add or update)
        return await this.run(
            `UPDATE cards SET quantity = quantity + ? WHERE card_id = ?`,
            [quantity, cardId]
        );
    }

    async getCollection(sortBy: string = 'name', sortOrder: string = 'ASC'): Promise<Card[]> {
        return await this.all(
            `SELECT * FROM cards WHERE quantity > 0 ORDER BY ${sortBy} ${sortOrder}`
        );
    }

    async updateCollectionItem(cardId: string, quantity: number): Promise<any> {
        return await this.run(
            `UPDATE cards SET quantity = ? WHERE card_id = ?`,
            [quantity, cardId]
        );
    }

    async removeFromCollection(cardId: string): Promise<any> {
        // Set quantity to 0 to "remove" from collection
        return await this.run(
            `UPDATE cards SET quantity = 0 WHERE card_id = ?`,
            [cardId]
        );
    }

    async getCollectionStats(): Promise<CollectionStats> {
        const totalCards = await this.get(
            `SELECT COUNT(*) as count, SUM(quantity) as total_quantity FROM cards WHERE quantity > 0`
        );

        const totalValue = await this.get(
            `SELECT SUM(price * quantity) as total_value FROM cards WHERE quantity > 0 AND price IS NOT NULL`
        );

        const conditionBreakdown: Array<{ condition: string; count: number; total_quantity: number }> = [
            { condition: 'N/A', count: totalCards.count, total_quantity: totalCards.total_quantity }
        ];

        const typeBreakdown = await this.all(
            `SELECT type, COUNT(*) as count, SUM(quantity) as total_quantity FROM cards WHERE quantity > 0 AND type IS NOT NULL GROUP BY type ORDER BY count DESC`
        );

        return {
            totalUniqueCards: totalCards.count,
            totalCards: totalCards.total_quantity,
            totalValue: totalValue.total_value || 0,
            conditionBreakdown,
            typeBreakdown
        };
    }

    // Deck management methods
    async createDeck(name: string, description: string = ''): Promise<any> {
        return await this.run(`
            INSERT INTO decks (name, description)
            VALUES (?, ?)
        `, [name, description]);
    }

    async getAllDecks(): Promise<Deck[]> {
        return await this.all(`
            SELECT d.*, COUNT(dc.id) as card_count
            FROM decks d
            LEFT JOIN deck_cards dc ON d.id = dc.deck_id
            GROUP BY d.id
            ORDER BY d.created_at DESC
        `);
    }

    async getDeckWithCards(deckId: number): Promise<DeckWithCards | null> {
        const deck = await this.get(`SELECT * FROM decks WHERE id = ?`, [deckId]);

        if (!deck) return null;

        const cards = await this.all(`
            SELECT c.*, dc.quantity
            FROM cards c
            JOIN deck_cards dc ON c.card_id = dc.card_id
            WHERE dc.deck_id = ?
            ORDER BY c.name
        `, [deckId]);

        return { ...deck, cards };
    }

    async addCardToDeck(deckId: number, cardId: string, quantity: number = 1): Promise<any> {
        return await this.run(`
            INSERT OR REPLACE INTO deck_cards (deck_id, card_id, quantity)
            VALUES (?, ?, ?)
        `, [deckId, cardId, quantity]);
    }

    async removeCardFromDeck(deckId: number, cardId: string): Promise<any> {
        return await this.run(`
            DELETE FROM deck_cards 
            WHERE deck_id = ? AND card_id = ?
        `, [deckId, cardId]);
    }

    async getTotalCardsCount(): Promise<number> {
        const result = await this.get(`SELECT COUNT(*) as count FROM cards`);
        return result.count || 0;
    }

    async getFilteredCardsCount(filters: SearchFilters): Promise<number> {
        let query = `SELECT COUNT(*) as count FROM cards WHERE 1=1`;
        const params: any[] = [];

        if (filters.search) {
            query += ` AND (name LIKE ? OR description LIKE ? OR archetype LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }
        if (filters.race) {
            query += ` AND race = ?`;
            params.push(filters.race);
        }
        if (filters.attribute) {
            query += ` AND attribute = ?`;
            params.push(filters.attribute);
        }
        if (filters.archetype) {
            query += ` AND archetype = ?`;
            params.push(filters.archetype);
        }
        if (filters.minAtk !== null && filters.minAtk !== undefined) {
            query += ` AND atk >= ?`;
            params.push(filters.minAtk);
        }
        if (filters.maxAtk !== null && filters.maxAtk !== undefined) {
            query += ` AND atk <= ?`;
            params.push(filters.maxAtk);
        }
        if (filters.minDef !== null && filters.minDef !== undefined) {
            query += ` AND def >= ?`;
            params.push(filters.minDef);
        }
        if (filters.maxDef !== null && filters.maxDef !== undefined) {
            query += ` AND def <= ?`;
            params.push(filters.maxDef);
        }
        if (filters.level !== null && filters.level !== undefined) {
            query += ` AND level = ?`;
            params.push(filters.level);
        }

        const result = await this.get(query, params);
        return result.count || 0;
    }
}
