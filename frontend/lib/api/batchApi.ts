// Batch API functions for preload pagination
// Tối ưu API calls cho batch loading nhiều trang cùng lúc

import { api } from '@/lib/api'
import { Guest, Event } from '@/lib/types/guest'

export interface BatchApiResponse<T = any> {
  data: { [page: number]: T[] }
  pagination: {
    total_items: number
    total_pages: number
    items_per_page: number
    loaded_pages: number[]
  }
}

export interface BatchApiParams {
  pages: number[]
  items_per_page: number
  filters: Record<string, any>
}

export interface BatchStatsResponse {
  guests?: {
    total: number
    accepted: number
    declined: number
    pending: number
    checked_in: number
  }
  events?: {
    total: number
    upcoming: number
    ongoing: number
    completed: number
    cancelled: number
  }
  checkin?: {
    total: number
    checked_in: number
    not_checked_in: number
  }
}

// Batch get guests for multiple pages
export async function batchGetGuests(params: BatchApiParams): Promise<BatchApiResponse<Guest>> {
  try {
    const response = await fetch('/api/batch/guests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in batch get guests:', error)
    throw error
  }
}

// Batch get events for multiple pages
export async function batchGetEvents(params: BatchApiParams): Promise<BatchApiResponse<Event>> {
  try {
    const response = await fetch('/api/batch/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in batch get events:', error)
    throw error
  }
}

// Batch get checked-in guests for multiple pages
export async function batchGetCheckin(params: BatchApiParams): Promise<BatchApiResponse<Guest>> {
  try {
    const response = await fetch('/api/batch/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in batch get checkin:', error)
    throw error
  }
}

// Batch get statistics for multiple entities
export async function batchGetStats(entities: string[], filters: Record<string, any> = {}): Promise<BatchStatsResponse> {
  try {
    const response = await fetch('/api/batch/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entities,
        filters
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in batch get stats:', error)
    throw error
  }
}

// Clear batch cache
export async function clearBatchCache(): Promise<void> {
  try {
    const response = await fetch('/api/batch/cache/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error clearing batch cache:', error)
    throw error
  }
}

// Get batch cache statistics
export async function getBatchCacheStats(): Promise<{
  total_entries: number
  total_size_bytes: number
  cache_ttl_seconds: number
}> {
  try {
    const response = await fetch('/api/batch/cache/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting batch cache stats:', error)
    throw error
  }
}

// Optimized batch loading with retry logic
export async function batchLoadWithRetry<T>(
  batchFunction: () => Promise<BatchApiResponse<T>>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<BatchApiResponse<T>> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await batchFunction()
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`Batch load attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }
  
  throw lastError || new Error('Batch load failed after all retries')
}

// Smart batch loading with adaptive page selection
export function createSmartBatchLoader<T>(
  batchFunction: (params: BatchApiParams) => Promise<BatchApiResponse<T>>,
  itemsPerPage: number = 10
) {
  const cache = new Map<string, BatchApiResponse<T>>()
  const loadingPromises = new Map<string, Promise<BatchApiResponse<T>>>()
  
  return {
    async loadPages(
      pages: number[],
      filters: Record<string, any>,
      options: {
        useCache?: boolean
        maxConcurrent?: number
        retryAttempts?: number
      } = {}
    ): Promise<BatchApiResponse<T>> {
      const {
        useCache = true,
        maxConcurrent = 3,
        retryAttempts = 2
      } = options
      
      // Create cache key
      const cacheKey = JSON.stringify({ pages: pages.sort(), filters, itemsPerPage })
      
      // Check cache first
      if (useCache && cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }
      
      // Check if already loading
      if (loadingPromises.has(cacheKey)) {
        return loadingPromises.get(cacheKey)!
      }
      
      // Create loading promise
      const loadingPromise = this.loadPagesInternal(pages, filters, retryAttempts)
      loadingPromises.set(cacheKey, loadingPromise)
      
      try {
        const result = await loadingPromise
        cache.set(cacheKey, result)
        return result
      } finally {
        loadingPromises.delete(cacheKey)
      }
    },
    
    async loadPagesInternal(
      pages: number[],
      filters: Record<string, any>,
      retryAttempts: number
    ): Promise<BatchApiResponse<T>> {
      // Split pages into chunks for concurrent loading
      const chunks = this.chunkArray(pages, Math.ceil(pages.length / 3))
      const results: BatchApiResponse<T>[] = []
      
      for (const chunk of chunks) {
        const chunkPromise = batchLoadWithRetry(
          () => batchFunction({
            pages: chunk,
            items_per_page: itemsPerPage,
            filters
          }),
          retryAttempts
        )
        results.push(await chunkPromise)
      }
      
      // Merge results
      const mergedData: { [page: number]: T[] } = {}
      let totalItems = 0
      let totalPages = 0
      const loadedPages: number[] = []
      
      for (const result of results) {
        Object.assign(mergedData, result.data)
        totalItems = result.pagination.total_items
        totalPages = result.pagination.total_pages
        loadedPages.push(...result.pagination.loaded_pages)
      }
      
      return {
        data: mergedData,
        pagination: {
          total_items: totalItems,
          total_pages: totalPages,
          items_per_page: itemsPerPage,
          loaded_pages: loadedPages
        }
      }
    },
    
    chunkArray<T>(array: T[], chunkSize: number): T[][] {
      const chunks: T[][] = []
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize))
      }
      return chunks
    },
    
    clearCache(): void {
      cache.clear()
    },
    
    getCacheStats(): { size: number; keys: string[] } {
      return {
        size: cache.size,
        keys: Array.from(cache.keys())
      }
    }
  }
}

// Export smart batch loaders for each entity
export const smartGuestsLoader = createSmartBatchLoader(batchGetGuests, 6)
export const smartEventsLoader = createSmartBatchLoader(batchGetEvents, 10)
export const smartCheckinLoader = createSmartBatchLoader(batchGetCheckin, 10)
