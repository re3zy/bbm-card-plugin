# Client-Side Data Processing Guide

## Overview

This plugin now processes **raw inventory snapshot data** directly, eliminating the need for complex SQL queries in Sigma. Users can simply upload their CSV or point to their inventory table, and the plugin automatically generates transfer recommendations.

## What Changed

### Before
- Required pre-processed data with shortage/excess joins done in SQL
- Users had to map 15+ columns manually
- Complex SQL query needed in Sigma

### After
- Accepts raw inventory snapshot data
- Automatic column detection by name
- All processing done in JavaScript
- Only 3 configuration options needed

## How It Works

### Step 1: Data Input
Plugin accepts raw inventory data with these columns:
- `product_key`, `product_name`, `sku_number`
- `store_name`, `store_city`
- `quantity_on_hand`, `reorder_point`, `days_of_supply`
- `avg_daily_sales_30d`, `avg_daily_sales_90d`
- `stockout_risk` (values: 'Critical', 'High', 'Overstocked')

### Step 2: Data Processing (in App.tsx)

#### 2.1 Convert Columnar to Row Format
Sigma provides data in columnar format. We convert to row objects:
```typescript
const inventoryRows = Array.from({ length: numRows }, (_, rowIndex) => {
  const row: any = {};
  columnIds.forEach((columnId) => {
    const columnName = columnInfo[columnId].name;
    row[columnName] = sigmaData[columnId][rowIndex];
  });
  return row;
});
```

#### 2.2 Separate Shortage and Excess Stores
```typescript
const shortageStores = inventoryRows.filter(row => 
  row.stockout_risk === 'Critical' || row.stockout_risk === 'High'
);

const excessStores = inventoryRows.filter(row => 
  row.stockout_risk === 'Overstocked' && 
  (row.avg_daily_sales_30d || 0) > 0
);
```

#### 2.3 Match and Calculate
For each shortage store, find matching excess stores with same product:
```typescript
shortageStores.forEach(shortage => {
  const matchingExcess = excessStores.filter(excess => 
    excess.product_key === shortage.product_key
  );
  
  matchingExcess.forEach(excess => {
    // Calculate derived metrics
    const shortageNeeded = reorder_point - quantity_on_hand;
    const excessAvailable = quantity_on_hand - (avg_daily_sales_30d * 30);
    const shortageTrend = ((sales30d - sales90d) / sales90d) * 100;
    const recommendedQty = Math.min(shortageNeeded, excessAvailable, 100);
    
    // Create recommendation object
    recommendations.push({
      product_name: shortage.product_name,
      sku_number: shortage.sku_number,
      shortage_store_name: shortage.store_name,
      shortage_city: shortage.store_city,
      shortage_qty: quantity_on_hand,
      shortage_needed: shortageNeeded,
      shortage_days: shortage.days_of_supply,
      shortage_trend: shortageTrend,
      excess_store_name: excess.store_name,
      excess_city: excess.store_city,
      excess_qty: excess.quantity_on_hand,
      excess_available: excessAvailable,
      excess_days: excess.days_of_supply,
      excess_trend: excessTrend,
      recommended_transfer_qty: recommendedQty
    });
  });
});
```

#### 2.4 Sort and Filter
```typescript
const sortedRecommendations = recommendations
  .sort((a, b) => a.shortage_days - b.shortage_days) // Most urgent first
  .slice(0, maxRecommendations); // Limit results
```

## Configuration Options

### source (element)
- The inventory data source (CSV upload or table)
- Plugin automatically finds required columns by name

### minCardWidth (dropdown)
- Options: "400px", "500px", "600px", "700px"
- Default: "500px"
- Controls the minimum width of each card in the grid

### containerPadding (dropdown)
- Options: "0rem", "1rem", "2rem"
- Default: "1rem"
- Controls spacing around the card grid

### maxRecommendations (dropdown)
- Options: "10", "25", "50", "100"
- Default: "50"
- Limits the number of recommendations displayed

## Benefits

### For Users
- ✅ No SQL knowledge required
- ✅ Simple CSV upload
- ✅ Automatic column detection
- ✅ Faster setup (< 1 minute)

### For Developers
- ✅ More portable (works with any data source)
- ✅ Easier to test (just load CSV)
- ✅ Better error handling
- ✅ More flexible filtering/sorting

### Performance
- ⚡ Fast processing (handles 50,000+ rows efficiently)
- 💾 All calculations done client-side
- 🔄 Results update automatically when data changes

## Testing

Use the included `Base for Recommendations Plugin.csv`:
- 50,000 inventory records
- Multiple stores and products
- Mix of Critical, High, and Overstocked items
- Real sales data for trend calculations

Expected output: ~50 transfer recommendations (configurable)

## Troubleshooting

### No recommendations showing?
- Check console for error messages
- Verify required columns exist in your data
- Check that stockout_risk column has 'Critical', 'High', or 'Overstocked' values
- Ensure product_key matches between shortage and excess stores

### Wrong calculations?
- Verify avg_daily_sales_30d and avg_daily_sales_90d are populated
- Check that quantity_on_hand and reorder_point are numeric
- Review console logs for processing details

### Performance issues?
- Reduce maxRecommendations setting
- Filter data in Sigma before passing to plugin
- Check for null/invalid values in source data

## Future Enhancements

Potential additions:
- Distance calculation between stores
- Custom filter criteria (by product, store, region)
- Export recommendations to CSV
- Bulk transfer initiation
- Historical trend visualization

