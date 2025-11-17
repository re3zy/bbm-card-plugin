# Debugging Guide: Transfer Recommendation Plugin

## Issue: "No Transfer Recommendations" Message

If you see "No Transfer Recommendations - Configure your data source to see Transfer recommendations", follow these debugging steps.

### Step 1: Open Browser Console

1. Open your browser's developer tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Refresh the Sigma workbook page
4. Look for plugin log messages

### Step 2: Check Console Output

The plugin logs detailed information. Look for these messages:

#### Expected Output (Success):
```
Transfer Card Plugin: Processing 50000 inventory records
Available columns: [list of column names]
Found 150 shortage stores and 850 excess stores
Generated 45 total transfer recommendations
Showing recommendation #1: Sony WH-1000XM5 Headphones
```

#### Common Issues and What They Mean:

**1. "No data available"**
- **Cause**: No data source selected or data not loaded
- **Fix**: Select your CSV/table in the plugin config panel

**2. "No columns found"**
- **Cause**: Data source exists but has no columns
- **Fix**: Verify your CSV uploaded correctly in Sigma

**3. "Found 0 shortage stores and 0 excess stores"**
- **Cause**: Column name mismatch or wrong values
- **Fixes**:
  - Check that `stockout_risk` column exists
  - Verify values are exactly: 'Critical', 'High', or 'Overstocked'
  - Check for extra spaces or case sensitivity

**4. "Generated 0 total transfer recommendations"**
- **Causes**:
  - No matching products between shortage and excess stores
  - `product_key` values don't match
  - All excess_available values are ≤ 10
- **Fixes**:
  - Verify same products exist in both shortage and excess stores
  - Check `product_key` column for consistency

### Step 3: Verify Required Columns

The plugin needs these EXACT column names (case-sensitive):

#### Product Columns:
- `product_key` - Unique identifier to match products
- `product_name` - Display name
- `sku_number` - SKU code

#### Store Columns:
- `store_name` - Full store name
- `store_city` - City name

#### Inventory Columns:
- `quantity_on_hand` - Current inventory level
- `reorder_point` - Minimum threshold
- `days_of_supply` - Days until stockout
- `stockout_risk` - Must be 'Critical', 'High', or 'Overstocked'

#### Sales Columns (for trends):
- `avg_daily_sales_30d` - 30-day average
- `avg_daily_sales_90d` - 90-day average

### Step 4: Check Column Names in Console

When the plugin loads, it logs: `Available columns: [...]`

Compare this list with the required columns above. If any are missing or spelled differently:

**Option A: Fix Your Data**
- Rename columns to match exactly

**Option B: Modify the Plugin**
- Update `App.tsx` to use your column names
- Search for column references and replace with your names

### Step 5: Test with Sample Data

Use the QUICK_START.md sample data to verify the plugin works:

```csv
product_name,sku_number,shortage_store_name,shortage_city,shortage_qty,shortage_needed,shortage_days,shortage_trend,excess_store_name,excess_city,excess_qty,excess_available,excess_days,excess_trend,recommended_transfer_qty
Sony WH-1000XM5 Headphones,AU-SO-0000000608,Big Buys Los Angeles #100010,"Los Angeles, CA",2,28,2.9,27,Big Buys Premium Pacoima #100019,"Pacoima, CA",120,90,857,-30,50
```

If this works but your data doesn't, the issue is with your data format.

### Step 6: Check Data Processing Logic

The plugin follows this logic:

1. **Filter Shortage Stores**:
   ```javascript
   row.stockout_risk === 'Critical' || row.stockout_risk === 'High'
   ```

2. **Filter Excess Stores**:
   ```javascript
   row.stockout_risk === 'Overstocked' && (row.avg_daily_sales_30d || 0) > 0
   ```

3. **Match Products**:
   ```javascript
   excess.product_key === shortage.product_key
   ```

4. **Calculate Metrics**:
   ```javascript
   shortageNeeded = reorder_point - quantity_on_hand (must be > 0)
   excessAvailable = quantity_on_hand - (avg_daily_sales_30d * 30) (must be > 10)
   ```

5. **Create Recommendation** only if `excessAvailable > 10`

### Step 7: Verify Specific Products

To check if Sony headphones should match:

1. Find shortage store:
   - Look for `stockout_risk = 'Critical' or 'High'`
   - Product: Sony WH-1000XM5 Headphones
   - Should have low `quantity_on_hand` and `days_of_supply`

2. Find excess store:
   - Look for `stockout_risk = 'Overstocked'`
   - Same `product_key` as shortage store
   - Should have high `quantity_on_hand` and `days_of_supply`

3. Both must exist with matching `product_key` for recommendation to generate

### Step 8: Common Data Issues

#### Issue: Case Sensitivity
```
❌ "critical" or "CRITICAL" → Won't match
✅ "Critical" → Will match
```

#### Issue: Extra Spaces
```
❌ "Critical " or " Critical" → Won't match
✅ "Critical" → Will match
```

#### Issue: Null Values
```
❌ product_key is null or empty → Won't match
❌ avg_daily_sales_30d is null → Store filtered out
```

#### Issue: Data Types
```
❌ quantity_on_hand is text "2" → May cause calculation errors
✅ quantity_on_hand is number 2 → Correct
```

### Step 9: Advanced Debugging

Add temporary logging to `App.tsx`:

```typescript
// After filtering shortage/excess stores, add:
console.log("Sample shortage store:", shortageStores[0]);
console.log("Sample excess store:", excessStores[0]);

// After matching, add:
console.log("First 5 recommendations:", recommendations.slice(0, 5));
```

This will show you the actual data being processed.

### Step 10: Still Not Working?

Contact support with:
1. Screenshot of browser console output
2. First 5 rows of your CSV (with sensitive data removed)
3. List of column names from console log
4. Description of what you're seeing vs. what you expect

## Quick Test Command

Run this in the browser console after the plugin loads:

```javascript
// This will show you raw data structure
console.log("Sigma Data Keys:", Object.keys(window));
```

## Expected Behavior

With the provided `Base for Recommendations Plugin.csv`:
- Should find ~150 shortage stores (Critical/High)
- Should find ~850 excess stores (Overstocked)
- Should generate 40-50 transfer recommendations
- Sony WH-1000XM5 should be recommendation #1 or #2
- Apple AirPods should be in top 5 recommendations

