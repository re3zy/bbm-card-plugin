/**
 * Type definitions for the Transfer Recommendation Card Plugin
 * 
 * These types ensure type safety across the plugin components
 * and provide clear documentation of expected data structures
 */

/**
 * Transfer Recommendation Data Structure
 * 
 * Represents a single transfer opportunity between a shortage store
 * and an excess inventory store for a specific product
 */
export interface TransferRecommendation {
  // Product Information
  product_name: string | number;
  sku_number: string | number;
  
  // Shortage Store (Critical/High Risk)
  shortage_store_name: string | number;
  shortage_city: string | number;
  shortage_qty: string | number;
  shortage_needed: string | number;
  shortage_days: string | number;
  shortage_trend: string | number;
  
  // Excess Store (Overstocked)
  excess_store_name: string | number;
  excess_city: string | number;
  excess_qty: string | number;
  excess_available: string | number;
  excess_days: string | number;
  excess_trend: string | number;
  
  // Transfer Details
  recommended_transfer_qty: string | number;
  
  // Optional Fields
  distance?: string | number;
  
  // Allow for additional fields from Sigma
  [key: string]: string | number | undefined;
}

/**
 * Sigma Column Information
 * 
 * Extended type for Sigma's WorkbookElementColumn with format information
 */
export interface ExtendedColumnInfo extends Record<string, any> {
  name: string;
  columnType: string;
  format?: {
    format: string;
  };
}

/**
 * Plugin Configuration
 * 
 * Configuration options available in Sigma's editor panel
 */
export interface PluginConfig {
  source?: string;
  columns?: string[];
  minCardWidth?: string;
  containerPadding?: string;
}

/**
 * Transfer Action Data
 * 
 * Data structure passed when initiating a transfer
 */
export interface TransferActionData {
  product_name?: string | number;
  sku_number?: string | number;
  excess_store_name?: string | number;
  shortage_store_name?: string | number;
  recommended_transfer_qty?: string | number;
  [key: string]: string | number | undefined;
}

