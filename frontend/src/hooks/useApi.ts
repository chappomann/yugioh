import { useState, useCallback } from 'react'
import { AxiosError } from 'axios'
import { ApiResponse } from '../types'

interface UseApiState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
    execute: (apiCall: () => Promise<any>) => Promise<T | null>
    reset: () => void
    setData: (data: T | null) => void
}

export function useApi<T = any>(initialData: T | null = null): UseApiReturn<T> {
    const [state, setState] = useState<UseApiState<T>>({
        data: initialData,
        loading: false,
        error: null,
    })

    const execute = useCallback(async (apiCall: () => Promise<any>): Promise<T | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const response = await apiCall()

            // Handle new backend API response format
            if (response.data && typeof response.data === 'object' && 'success' in response.data) {
                const apiResponse: ApiResponse<T> = response.data

                if (apiResponse.success) {
                    setState(prev => ({
                        ...prev,
                        data: apiResponse.data || null,
                        loading: false
                    }))
                    return apiResponse.data || null
                } else {
                    const errorMessage = apiResponse.error || apiResponse.message || 'An error occurred'
                    setState(prev => ({
                        ...prev,
                        error: errorMessage,
                        loading: false
                    }))
                    return null
                }
            } else {
                // Handle legacy response format
                setState(prev => ({
                    ...prev,
                    data: response.data,
                    loading: false
                }))
                return response.data
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error)
            setState(prev => ({
                ...prev,
                error: errorMessage,
                loading: false
            }))
            return null
        }
    }, [])

    const reset = useCallback(() => {
        setState({
            data: initialData,
            loading: false,
            error: null,
        })
    }, [initialData])

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }))
    }, [])

    return {
        ...state,
        execute,
        reset,
        setData,
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        if (error.response?.data?.error) {
            return error.response.data.error
        }
        if (error.response?.data?.message) {
            return error.response.data.message
        }
        if (error.message) {
            return error.message
        }
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred'
}