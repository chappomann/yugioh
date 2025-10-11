/**
 * Yu-Gi-Oh Card Data Downloader
 * 
 * Handles downloading fresh card data from the YGOPRODeck API and saving it to carddb.json.
 * This module is focused solely on data retrieval and local caching.
 * 
 * Features:
 * - Downloads card data from YGOPRODeck API
 * - Saves data to /databases/carddb.json
 * - Validates API response format
 * - Error handling for network issues
 * 
 * Usage:
 * import { CardDataDownloader } from './card-data-downloader.js';
 * const downloader = new CardDataDownloader();
 * await downloader.downloadFreshCardData();
 */

import fs from 'fs/promises';
import path from 'path';
import { CardData, YugiohApiResponse } from '../types/shared.js';

export class CardDataDownloader {
    private apiUrl: string = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
    private cardDbPath: string;

    constructor(cardDbPath?: string) {
        this.cardDbPath = cardDbPath || path.join(process.cwd(), '../../databases/carddb.json');
    }

    async downloadFreshCardData(): Promise<YugiohApiResponse> {
        try {
            console.log('Downloading fresh card data from YGOPRODeck API...');

            // First, try to load existing quantities
            let existingQuantities: Map<number, number> = new Map();
            try {
                const existingData = await this.loadCardData();
                existingData.data.forEach((card: CardData) => {
                    if (card.id && card.quantity !== undefined) {
                        existingQuantities.set(card.id, card.quantity);
                    }
                });
                console.log(`Loaded ${existingQuantities.size} existing card quantities`);
            } catch (error) {
                console.log('No existing carddb.json found or error loading it, starting with fresh quantities');
            }

            const response = await fetch(this.apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawCardData: YugiohApiResponse = await response.json();

            if (!this.validateApiResponse(rawCardData)) {
                throw new Error('Invalid API response format');
            }

            // Preserve existing quantities or default to 0 for new cards
            const cardData: YugiohApiResponse = {
                data: rawCardData.data.map((card: CardData) => ({
                    ...card,
                    quantity: existingQuantities.get(card.id) || 0
                }))
            };

            await this.saveCardData(cardData);
            const preservedCount = cardData.data.filter((card: CardData) => existingQuantities.has(card.id)).length;
            console.log(`Downloaded ${cardData.data.length} cards and saved to carddb.json`);
            console.log(`Preserved quantities for ${preservedCount} existing cards`);

            return cardData;
        } catch (error) {
            console.error('Error downloading card data:', error);
            throw error;
        }
    }

    async loadCardData(): Promise<YugiohApiResponse> {
        try {
            console.log('Loading card data from local file...');
            const fileContent = await fs.readFile(this.cardDbPath, 'utf8');
            const cardData: YugiohApiResponse = JSON.parse(fileContent);

            if (!this.validateApiResponse(cardData)) {
                throw new Error('Invalid card data format in local file');
            }

            console.log(`Loaded ${cardData.data.length} cards from carddb.json`);
            return cardData;
        } catch (error) {
            console.error('Error loading card data:', error);
            throw error;
        }
    }

    async searchCardByName(cardName: string): Promise<CardData | null> {
        try {
            const response = await fetch(`${this.apiUrl}?name=${encodeURIComponent(cardName)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: YugiohApiResponse = await response.json();

            if (data.data && data.data.length > 0) {
                return data.data[0];
            }

            return null;
        } catch (error) {
            console.error(`Error searching for card: ${cardName}`, error);
            throw error;
        }
    }

    private async saveCardData(cardData: YugiohApiResponse): Promise<void> {
        try {
            // Ensure the databases directory exists
            const dbDir = path.dirname(this.cardDbPath);
            await fs.mkdir(dbDir, { recursive: true });

            await fs.writeFile(this.cardDbPath, JSON.stringify(cardData, null, 2));
        } catch (error) {
            console.error('Error saving card data:', error);
            throw error;
        }
    }

    private validateApiResponse(data: any): data is YugiohApiResponse {
        return data &&
            typeof data === 'object' &&
            Array.isArray(data.data) &&
            data.data.length > 0;
    }

    getCardDbPath(): string {
        return this.cardDbPath;
    }
}
