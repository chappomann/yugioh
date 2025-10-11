import axios from 'axios'
import { Card } from '../types'

const API_BASE = 'http://localhost:3001/api'

// Cards API
export const cardsApi = {
    getAll: (params?: any) => axios.get(`${API_BASE}/cards`, { params }),
    getById: (id: string) => axios.get(`${API_BASE}/cards/${id}`),
    create: (card: Omit<Card, 'id'>) => axios.post(`${API_BASE}/cards`, card),
    updateQuantity: (id: number, quantity: number) => axios.put(`${API_BASE}/cards/${id}/quantity`, { quantity }),
    getStats: () => axios.get(`${API_BASE}/cards/stats`),
    getFilters: () => axios.get(`${API_BASE}/cards/filters`),
}

// Import API
export const importApi = {
    importData: () => axios.post(`${API_BASE}/import`),
}
