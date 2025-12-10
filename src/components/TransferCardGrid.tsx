import React from "react";
import TransferCard from "./TransferCard";
import { TransferRecommendation } from "../types";

// Interface for the grid component props
interface TransferCardGridProps {
  data: TransferRecommendation[];
  minCardWidth: string;
  cardNumber?: number;
  onSetShortageKey: (...values: unknown[]) => void;
  onSetExcessKey: (...values: unknown[]) => void;
  onSetTransferRec: (...values: unknown[]) => void;
  onSetTransferId: (...values: unknown[]) => void;
  onSetStatus: (...values: unknown[]) => void;
  onTriggerAction: () => void;
  onDetailsAction: () => void;
}

/**
 * TransferCardGrid Component
 * 
 * Renders a responsive grid of transfer recommendation cards
 * 
 * Features:
 * - CSS Grid layout with configurable minimum card width
 * - Auto-fit columns based on available space
 * - Proper spacing and gap between cards
 * - Empty state handling
 * - Passes click handler to individual cards for Sigma interactions
 */
const TransferCardGrid: React.FC<TransferCardGridProps> = ({ 
  data, 
  minCardWidth,
  cardNumber,
  onSetShortageKey,
  onSetExcessKey,
  onSetTransferRec,
  onSetTransferId,
  onSetStatus,
  onTriggerAction,
  onDetailsAction
}) => {
  
  /**
   * Generate a unique transfer ID
   * Format: TR-[timestamp]-[random]
   */
  const generateTransferId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TR-${timestamp}-${random}`;
  };

  /**
   * Handle the "Initiate Transfer Request" button click
   * 
   * Sets Sigma control values for the selected transfer:
   * - p-shortageKey: The store key of the shortage store
   * - p-excessKey: The store key of the excess store
   * - p-TransferRec: The recommended transfer quantity
   * - p-TransferId: Unique transfer ID
   * - p-Status: Set to "Warehouse Review"
   * Then triggers the action sequence in Sigma
   */
  const handleInitiateTransfer = (transferData: any) => {
    console.log("=== Initiating Transfer Request ===");
    
    try {
      // Generate unique transfer ID
      const transferId = generateTransferId();
      
      // Extract values from transfer data
      const shortageKey = transferData.shortage_store_key || "";
      const excessKey = transferData.excess_store_key || "";
      const transferQty = transferData.recommended_transfer_qty || 0;
      
      // Set all control values
      console.log("Setting p-shortageKey:", shortageKey);
      onSetShortageKey(shortageKey);
      
      console.log("Setting p-excessKey:", excessKey);
      onSetExcessKey(excessKey);
      
      console.log("Setting p-TransferRec:", transferQty);
      onSetTransferRec(transferQty);
      
      console.log("Setting p-TransferId:", transferId);
      onSetTransferId(transferId);
      
      console.log("Setting p-Status:", "Warehouse Review");
      onSetStatus("Warehouse Review");
      
      console.log("✅ All controls set successfully!");
      
      // Trigger the action sequence
      console.log("🚀 Triggering action sequence...");
      onTriggerAction();
      
      console.log("✅ Action triggered!");
    } catch (error) {
      console.error("❌ Error during transfer initiation:", error);
    }
  };

  // Empty state: no data to display
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📦</div>
          <div className="text-gray-600 font-medium">No Transfer Recommendations</div>
          <div className="text-gray-500 text-sm mt-1">
            Configure your data source to see transfer recommendations
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="transfer-card-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`,
        gap: '1.5rem',
        width: '100%',
      }}
    >
      {data.map((transfer, index) => (
        <TransferCard
          key={index}
          data={transfer}
          cardNumber={cardNumber || (index + 1)}
          onInitiateTransfer={handleInitiateTransfer}
          onDetailsClick={onDetailsAction}
        />
      ))}
    </div>
  );
};

export default TransferCardGrid;

