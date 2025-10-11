/**
 * Shared type definitions used across multiple utility modules
 * This prevents duplication of interfaces across card-importer, database-importer, and card-data-downloader
 */

export interface CardData {
    id: number;
    name: string;
    type?: string;
    race?: string;
    archetype?: string;
    atk?: number;
    def?: number;
    level?: number;
    attribute?: string;
    desc?: string;
    description?: string;
    quantity?: number;
    card_images?: Array<{
        image_url?: string;
        image_url_small?: string;
    }>;
    card_prices?: Array<{
        tcgplayer_price?: string;
        cardmarket_price?: string;
        ebay_price?: string;
    }>;
}

export interface YugiohApiResponse {
    data: CardData[];
}

export interface NormalizedCard {
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
    quantity: number;
}

export interface ImportResult {
    imported: number;
    errors: number;
    imagesDownloaded?: number;
    imageErrors?: number;
}

export interface ImportStats {
    totalCards: number;
    cardTypes: Array<{ type: string; count: number }>;
    attributes: Array<{ attribute: string; count: number }>;
}