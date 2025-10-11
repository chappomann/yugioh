import axios from 'axios'
import { Card } from '../types'

// Use environment variable for API base URL with fallback
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Configure axios defaults
const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add request interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
)

// Cards API
export const cardsApi = {
    getAll: (params?: any) => apiClient.get('/cards', { params }),
    getById: (id: string) => apiClient.get(`/cards/${id}`),
    create: (card: Omit<Card, 'id'>) => apiClient.post('/cards', card),
    updateQuantity: (id: number, quantity: number) => apiClient.put(`/cards/${id}/quantity`, { quantity }),
    getStats: () => apiClient.get('/cards/stats'),
    getFilters: () => apiClient.get('/cards/filters'),
}

// Import API
export const importApi = {
    importData: () => apiClient.post('/import'),
}
