import React from "react";
import { TransferRecommendation } from "../types";

// Interface for the transfer recommendation card component props
interface TransferCardProps {
  data: TransferRecommendation;
  cardNumber?: number;
  onInitiateTransfer?: (data: TransferRecommendation) => void;
}

/**
 * TransferCard Component
 * 
 * Displays a single transfer recommendation card matching dashboard_mockup.html exactly
 */
const TransferCard: React.FC<TransferCardProps> = ({ data, cardNumber, onInitiateTransfer }) => {
  
  // Helper function to format trend with arrow
  const formatTrend = (trend: string | number): string => {
    const trendValue = typeof trend === 'string' ? parseFloat(trend) : trend;
    
    if (isNaN(trendValue)) return "0%";
    
    if (trendValue > 0) {
      return `+${Math.abs(trendValue)}% ↗️`;
    } else if (trendValue < 0) {
      return `${trendValue}% ↘️`;
    } else {
      return "0%";
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    return Math.round(num).toLocaleString();
  };

  // Helper function to safely get values with fallback
  const getValue = (key: string, fallback: string = "—"): string | number => {
    return data[key] !== undefined && data[key] !== null ? data[key] : fallback;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      maxWidth: '100%'
    }}>
      {/* Transfer Header */}
      <div style={{
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '16px'
      }}>
        Transfer Recommendation {cardNumber ? `#${cardNumber}` : ''}
      </div>
      
      {/* Product Information */}
      <div style={{
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <strong>Product:</strong> {getValue("product_name", "Product Name")}<br/>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          SKU: {getValue("sku_number", "N/A")}
        </span>
      </div>

      {/* Shortage Store Section */}
      <div style={{
        background: '#fee2e2',
        borderLeft: '4px solid #dc2626',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          🔴 SHORTAGE STORE
        </div>
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          {getValue("shortage_store_name", "Store Name")}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '12px'
        }}>
          {getValue("shortage_city", "City")}
        </div>
        
        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Current</span>
            <span style={{ fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>
              {formatNumber(getValue("shortage_qty", 0))} units
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Needed</span>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>
              {formatNumber(getValue("shortage_needed", 0))} units
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Days Supply</span>
            <span style={{ fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>
              {getValue("shortage_days", "0")} days ⚠️
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Trend</span>
            <span style={{ fontWeight: '600', fontSize: '15px', color: '#dc2626' }}>
              {formatTrend(getValue("shortage_trend", 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Transfer Arrow */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#f59e0b'
      }}>
        ↓ Transfer {formatNumber(getValue("recommended_transfer_qty", 0))} units ↓
      </div>

      {/* Excess Store Section */}
      <div style={{
        background: '#d1fae5',
        borderLeft: '4px solid #10b981',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          📦 EXCESS INVENTORY STORE
        </div>
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          {getValue("excess_store_name", "Store Name")}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '12px'
        }}>
          {getValue("excess_city", "City")}
          {data["distance"] && ` (${getValue("distance")} miles away)`}
        </div>
        
        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Current</span>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>
              {formatNumber(getValue("excess_qty", 0))} units
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Available</span>
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#10b981' }}>
              {formatNumber(getValue("excess_available", 0))} units
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Days Supply</span>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>
              {getValue("excess_days", "0")} days 📦
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#6b7280', fontSize: '11px' }}>Trend</span>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>
              {formatTrend(getValue("excess_trend", 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          onClick={() => onInitiateTransfer && onInitiateTransfer(data)}
          style={{
            padding: '12px 32px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            background: '#3b82f6',
            color: 'white',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          Initiate Transfer Request →
        </button>
      </div>
    </div>
  );
};

export default TransferCard;
