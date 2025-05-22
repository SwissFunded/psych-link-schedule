/**
 * Vitabyte ePAD API Configuration
 * 
 * This file contains configuration for the Vitabyte ePAD API integration.
 * In a production environment, these values should be stored in environment variables.
 */

// Base API URL - use local proxy to avoid CORS issues
export const VITABYTE_API_URL = '/api/proxy';

// API credentials
export const VITABYTE_API_KEY = import.meta.env.VITE_VITABYTE_API_KEY as string || '';
export const VITABYTE_API_SECRET = import.meta.env.VITE_VITABYTE_API_SECRET as string || '';

// Timeout for API requests in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Rate limiting configuration
export const RATE_LIMIT = {
  maxRequests: 100, // Maximum number of requests per time window
  timeWindow: 60000, // Time window in milliseconds (1 minute)
}; 