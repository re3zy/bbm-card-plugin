import { useMemo, useEffect } from "react";
import TransferCardGrid from "./components/TransferCardGrid";
import "./App.css";
import {
  client,
  useConfig,
  useElementData,
  usePaginatedElementData,
  useElementColumns,
  useVariable,
  useActionTrigger,
} from "@sigmacomputing/plugin";
import * as d3 from "d3";
import { ExtendedColumnInfo, TransferRecommendation } from "./types";

// Configure the Sigma editor panel with configuration options
// Each plugin instance shows ONE card - user can add multiple plugin instances for multiple cards
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "columns", type: "column", source: "source", allowMultiple: true },
  { name: "p-shortageKey", type: "variable" },
  { name: "p-excessKey", type: "variable" },
  { name: "p-TransferRec", type: "variable" },
  { name: "p-TransferId", type: "variable" },
  { name: "p-Status", type: "variable" },
  { name: "transferAction", type: "action-trigger" },
  {
    name: "cardIndex",
    type: "dropdown",
    values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    defaultValue: "1"
  },
  {
    name: "containerPadding",
    type: "dropdown",
    values: ["0rem", "1rem", "2rem"],
    defaultValue: "1rem"
  },
]);

function App() {
  const config = useConfig();
  
  // IMPORTANT: Check if source is actually configured
  if (!config.source) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6">
          <div className="text-gray-400 text-lg mb-2">⚙️</div>
          <div className="text-gray-600 font-medium">Configure Data Source</div>
          <div className="text-gray-500 text-sm mt-1">
            Select a data source in the plugin configuration panel
          </div>
        </div>
      </div>
    );
  }
  
  const { columns } = config;
  const sigmaData = useElementData(config.source);
  const columnInfo = useElementColumns(config.source) as Record<string, ExtendedColumnInfo>;
  const containerPadding = (client.config.getKey as any)("containerPadding") as string;
  const cardIndex = parseInt((client.config.getKey as any)("cardIndex") as string) || 1;
  
  // Get variable setters for the control values
  const shortageKeyConfigId = (config as any)['p-shortageKey'];
  const excessKeyConfigId = (config as any)['p-excessKey'];
  const transferRecConfigId = (config as any)['p-TransferRec'];
  const transferIdConfigId = (config as any)['p-TransferId'];
  const statusConfigId = (config as any)['p-Status'];
  
  const [shortageKeyVar, setShortageKey] = useVariable(shortageKeyConfigId);
  const [excessKeyVar, setExcessKey] = useVariable(excessKeyConfigId);
  const [transferRecVar, setTransferRec] = useVariable(transferRecConfigId);
  const [transferIdVar, setTransferId] = useVariable(transferIdConfigId);
  const [statusVar, setStatus] = useVariable(statusConfigId);
  
  // Get action trigger callback
  const triggerTransferAction = useActionTrigger(config.transferAction);

  // Dynamically update the root container padding based on config
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.padding = containerPadding;
    }
  }, [containerPadding]);

  /**
   * Helper function to check if all Sigma data is loaded
   * Sigma loads data asynchronously - this ensures we have actual row data
   */
  const isSigmaDataLoaded = (): boolean => {
    if (!columns || columns.length === 0) return false;
    if (!sigmaData) return false;
    if (!columnInfo) return false;
    
    const firstColumnId = columns[0];
    if (!sigmaData[firstColumnId]) return false;
    if (!Array.isArray(sigmaData[firstColumnId])) return false;
    if (sigmaData[firstColumnId].length === 0) return false;
    
    return true;
  };

  /**
   * Helper function to find column ID by name
   */
  const findColumnId = (name: string): string | null => {
    if (!columnInfo) return null;
    for (const [id, info] of Object.entries(columnInfo)) {
      if (info.name === name) return id;
    }
    return null;
  };

  /**
   * Helper function to get column data by name
   */
  const getColumnData = (name: string): any[] | null => {
    const columnId = findColumnId(name);
    if (!columnId || !sigmaData || !sigmaData[columnId]) return null;
    return sigmaData[columnId];
  };

  /**
   * Transform raw inventory snapshot data into transfer recommendations
   * 
   * Process:
   * 1. Convert columnar data to row objects
   * 2. Separate into shortage stores (Critical/High risk) and excess stores (Overstocked)
   * 3. Calculate derived fields (shortage_needed, excess_available, trends)
   * 4. Join shortage and excess by product_key
   * 5. Calculate recommended transfer quantities
   * 6. Filter and sort results
   */
  const transferData = useMemo(() => {
    // Wait for Sigma to fully load data before processing
    if (!isSigmaDataLoaded()) {
      return [];
    }

    const columnIds = columns;
    const firstColumnId = columnIds[0];
    
    if (!sigmaData[firstColumnId] || !Array.isArray(sigmaData[firstColumnId])) {
      return [];
    }

    const numRows = sigmaData[firstColumnId].length;

    // Step 1: Convert columnar data to row objects
    const inventoryRows = Array.from({ length: numRows }, (_, rowIndex) => {
      const row: any = {};
      columnIds.forEach((columnId) => {
        const columnName = columnInfo[columnId].name;
        row[columnName] = sigmaData[columnId][rowIndex];
      });
      return row;
    });

    // Step 2: Separate into shortage and excess stores
    const shortageStores = inventoryRows.filter(row => 
      row.stockout_risk === 'Critical' || row.stockout_risk === 'High'
    );

    const excessStores = inventoryRows.filter(row => 
      row.stockout_risk === 'Overstocked' && 
      (row.avg_daily_sales_30d || 0) > 0
    );

    // Step 3 & 4: Join shortage with excess by product_key and create recommendations
    const recommendations: TransferRecommendation[] = [];

    shortageStores.forEach(shortage => {
      // Find matching excess stores with same product
      const matchingExcess = excessStores.filter(excess => 
        excess.product_key === shortage.product_key
      );

      matchingExcess.forEach(excess => {
        // Calculate derived fields
        const shortageQty = Number(shortage.quantity_on_hand) || 0;
        const shortageNeeded = Math.max(0, (Number(shortage.reorder_point) || 0) - shortageQty);
        
        const excessQty = Number(excess.quantity_on_hand) || 0;
        const excessAvailable = Math.max(0, excessQty - ((Number(excess.avg_daily_sales_30d) || 0) * 30));
        
        // Skip if not enough excess available
        if (excessAvailable <= 10) return;

        // Calculate trends (percentage change from 90d to 30d avg sales)
        const shortageTrend = (() => {
          const sales30d = Number(shortage.avg_daily_sales_30d) || 0;
          const sales90d = Number(shortage.avg_daily_sales_90d) || 0;
          if (sales90d === 0) return 0;
          return Math.round(((sales30d - sales90d) / sales90d) * 100);
        })();

        const excessTrend = (() => {
          const sales30d = Number(excess.avg_daily_sales_30d) || 0;
          const sales90d = Number(excess.avg_daily_sales_90d) || 0;
          if (sales90d === 0) return 0;
          return Math.round(((sales30d - sales90d) / sales90d) * 100);
        })();

        // Calculate recommended transfer quantity (min of needed, available, and cap at 100)
        const recommendedQty = Math.min(shortageNeeded, excessAvailable, 100);

        // Create transfer recommendation object
        const recommendation: TransferRecommendation = {
          product_name: shortage.product_name || "",
          sku_number: shortage.sku_number || "",
          
          shortage_store_name: shortage.store_name || "",
          shortage_store_key: shortage.store_key || "", // Add store key for controls
          shortage_city: shortage.store_city || "",
          shortage_qty: shortageQty,
          shortage_needed: shortageNeeded,
          shortage_days: Number(shortage.days_of_supply) || 0,
          shortage_trend: shortageTrend,
          shortage_risk: shortage.stockout_risk || "High", // Store risk level for sorting
          
          excess_store_name: excess.store_name || "",
          excess_store_key: excess.store_key || "", // Add store key for controls
          excess_city: excess.store_city || "",
          excess_qty: excessQty,
          excess_available: excessAvailable,
          excess_days: Number(excess.days_of_supply) || 0,
          excess_trend: excessTrend,
          
          recommended_transfer_qty: recommendedQty,
        };

        recommendations.push(recommendation);
      });
    });

    // Step 5: Deduplicate - Keep only the BEST excess match for each shortage store + product
    // This prevents the same shortage from appearing multiple times
    const deduplicatedRecs = new Map<string, TransferRecommendation>();
    
    recommendations.forEach(rec => {
      const key = `${rec.product_name}|${rec.shortage_store_name}`;
      
      // If we haven't seen this shortage/product combo, add it
      if (!deduplicatedRecs.has(key)) {
        deduplicatedRecs.set(key, rec);
      } else {
        // If we have, keep the one with more available excess inventory
        const existing = deduplicatedRecs.get(key)!;
        const existingAvail = Number(existing.excess_available) || 0;
        const newAvail = Number(rec.excess_available) || 0;
        
        if (newAvail > existingAvail) {
          deduplicatedRecs.set(key, rec);
        }
      }
    });
    
    // Step 6: Sort by risk level first (Critical before High), then by shortage days
    const sortedRecommendations = Array.from(deduplicatedRecs.values())
      .sort((a, b) => {
        // Primary sort: Critical stockouts first, then High
        const aRisk = (a as any).shortage_risk === 'Critical' ? 0 : 1;
        const bRisk = (b as any).shortage_risk === 'Critical' ? 0 : 1;
        
        if (aRisk !== bRisk) {
          return aRisk - bRisk;
        }
        
        // Secondary sort: lowest days supply (most urgent)
        const aDays = Number(a.shortage_days) || 0;
        const bDays = Number(b.shortage_days) || 0;
        
        if (aDays !== bDays) {
          return aDays - bDays;
        }
        
        // Tertiary sort: highest recommended transfer quantity
        const aQty = Number(a.recommended_transfer_qty) || 0;
        const bQty = Number(b.recommended_transfer_qty) || 0;
        return bQty - aQty;
      });
    
    // Return only the recommendation at the specified index (1-based)
    const selectedRecommendation = sortedRecommendations[cardIndex - 1];
    
    if (selectedRecommendation) {
      return [selectedRecommendation];
    } else {
      return [];
    }
  }, [sigmaData, columnInfo, columns, cardIndex]);

  // Render single card (no grid needed since we show one card per plugin instance)
  // Pass cardIndex so the card title shows the correct number
  return transferData && transferData.length > 0 ? (
    <TransferCardGrid
      data={transferData}
      minCardWidth="100%"
      cardNumber={cardIndex}
      onSetShortageKey={setShortageKey}
      onSetExcessKey={setExcessKey}
      onSetTransferRec={setTransferRec}
      onSetTransferId={setTransferId}
      onSetStatus={setStatus}
      onTriggerAction={triggerTransferAction}
    />
  ) : null;
}

export default App;

