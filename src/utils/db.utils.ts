/**
 * Database Utilities
 * Helper functions for common database operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Type for pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Type for paginated response
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginate query results
 */
export async function paginateQuery<T>(
  queryBuilder: any,
  options: PaginationOptions
): Promise<PaginatedResponse<T>> {
  const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'desc' } = options;
  
  try {
    // Get count
    const countQuery = queryBuilder.clone();
    const { count, error: countError } = await countQuery.select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Get paginated data
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error: dataError } = await queryBuilder
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(from, to);
    
    if (dataError) throw dataError;
    
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: data || [],
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  } catch (error) {
    console.error('[DB Utils] Pagination error:', error);
    throw error;
  }
}

/**
 * Handle database errors
 */
export function handleDbError(error: any, defaultMessage: string = 'Database operation failed'): string {
  if (error.code === '23505') {
    return 'Duplicate entry found';
  } else if (error.code === '23503') {
    return 'Foreign key constraint violation';
  } else if (error.code === '23502') {
    return 'Not null violation';
  } else if (error.code === '42P01') {
    return 'Table not found';
  } else if (error.code === '42703') {
    return 'Column not found';
  }
  
  return error.message || defaultMessage;
}

/**
 * Generate unique ID
 */
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

/**
 * Format date for database storage
 */
export function formatDateForDb(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Parse date from database
 */
export function parseDateFromDb(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Sanitize data for database insertion
 */
export function sanitizeData<T>(data: T): T {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}

/**
 * Convert snake_case keys to camelCase
 */
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = snakeToCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Convert camelCase keys to snake_case
 */
export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = camelToSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T>(data: T, requiredFields: (keyof T)[]): string | null {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return `Field ${String(field)} is required`;
    }
  }
  return null;
}

/**
 * Filter object by allowed keys
 */
export function filterObjectByKeys<T>(obj: T, allowedKeys: (keyof T)[]): Partial<T> {
  const filtered: Partial<T> = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      filtered[key] = obj[key];
    }
  }
  
  return filtered;
}

/**
 * Merge two objects, with priority to the second object
 */
export function mergeObjects<T>(obj1: T, obj2: Partial<T>): T {
  return { ...obj1, ...obj2 };
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: any): boolean {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

export default {
  paginateQuery,
  handleDbError,
  generateId,
  formatDateForDb,
  parseDateFromDb,
  sanitizeData,
  snakeToCamel,
  camelToSnake,
  validateRequiredFields,
  filterObjectByKeys,
  mergeObjects,
  isEmpty,
  deepClone
};