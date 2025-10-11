export interface Card {
    id?: number
    card_id: string
    name: string
    type: string | null
    race: string | null
    archetype: string | null
    atk: number | null
    def: number | null
    level: number | null
    attribute: string | null
    description: string
    image_url: string | null
    price: number | null
    quantity: number
    created_at?: string
    updated_at?: string
}

export interface CollectionItem {
    id?: number
    card_id: string
    quantity: number
    condition: string
    acquired_date?: string
    notes?: string
    created_at?: string
    updated_at?: string
    card?: Card
}

export interface FilterOptions {
    types: string[]
    races: string[]
    attributes: string[]
    archetypes: string[]
    levels: number[]
}

export interface Stats {
    totalCards: number
    cardTypes: Array<{ type: string; count: number }>
    attributes: Array<{ attribute: string; count: number }>
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
    timestamp?: string
}
