# Sample Data for Testing

This file contains sample transfer recommendation data for testing the plugin.

## Data Format

The plugin expects data in this format (one row per transfer recommendation):

```json
[
  {
    "product_name": "Sony WH-1000XM5 Headphones",
    "sku_number": "AU-SO-0000000608",
    "shortage_store_name": "Big Buys Los Angeles #100010",
    "shortage_city": "Los Angeles, CA",
    "shortage_qty": 2,
    "shortage_needed": 28,
    "shortage_days": 2.9,
    "shortage_trend": 27,
    "excess_store_name": "Big Buys Premium Pacoima #100019",
    "excess_city": "Pacoima, CA",
    "excess_qty": 120,
    "excess_available": 90,
    "excess_days": 857,
    "excess_trend": -30,
    "recommended_transfer_qty": 50,
    "distance": 15
  },
  {
    "product_name": "Apple AirPods Pro Series",
    "sku_number": "AU-APPLE-0000000571",
    "shortage_store_name": "Big Buys Flagship Norwalk #100013",
    "shortage_city": "Norwalk, CA",
    "shortage_qty": 5,
    "shortage_needed": 22,
    "shortage_days": 2.4,
    "shortage_trend": 41,
    "excess_store_name": "Big Buys Premium LA #100021",
    "excess_city": "Los Angeles, CA",
    "excess_qty": 120,
    "excess_available": 85,
    "excess_days": 293,
    "excess_trend": -20,
    "recommended_transfer_qty": 40,
    "distance": 5
  }
]
```

## Column Descriptions

### Product Information
- **product_name**: Full product name
- **sku_number**: Stock keeping unit identifier

### Shortage Store (stores with critical/high risk inventory)
- **shortage_store_name**: Name of store with inventory shortage
- **shortage_city**: City location
- **shortage_qty**: Current quantity on hand
- **shortage_needed**: Quantity needed to reach reorder point
- **shortage_days**: Days of supply remaining (critical if < 3)
- **shortage_trend**: Sales trend percentage (positive = increasing demand)

### Excess Store (stores with overstocked inventory)
- **excess_store_name**: Name of store with excess inventory
- **excess_city**: City location
- **excess_qty**: Current quantity on hand
- **excess_available**: Units available for transfer (excess beyond 30-day supply)
- **excess_days**: Days of supply (overstocked if > 60)
- **excess_trend**: Sales trend percentage (negative = decreasing demand)

### Transfer Details
- **recommended_transfer_qty**: Suggested number of units to transfer
- **distance** (optional): Distance between stores in miles

## Creating Test Data in Sigma

### Option 1: Manual CSV Upload

1. Create a CSV file with the columns above
2. Upload to Sigma Computing
3. Use as the data source for the plugin

### Option 2: SQL Query

Use the query from README.md to generate real transfer recommendations from your inventory_snapshots data.

### Option 3: Mock Data Element

Create a Sigma input table with the columns and sample rows for quick testing:

```
Product Name | SKU | Shortage Store | ... (all columns)
Sony WH-1000XM5 | AU-SO-0000000608 | Big Buys LA #100010 | ...
Apple AirPods Pro | AU-APPLE-0000000571 | Big Buys Norwalk #100013 | ...
```

## Expected Visual Output

With the sample data above, you should see:

### Card 1: Sony Headphones
- **Shortage**: Los Angeles - 2 units (needs 28), 2.9 days, ↗️ +27%
- **Transfer**: 50 units
- **Excess**: Pacoima - 120 units (90 available), 857 days, ↘️ -30%

### Card 2: Apple AirPods
- **Shortage**: Norwalk - 5 units (needs 22), 2.4 days, ↗️ +41%
- **Transfer**: 40 units
- **Excess**: Los Angeles - 120 units (85 available), 293 days, ↘️ -20%

## Testing Scenarios

### Test 1: Normal Data
Use the sample data above - should display two cards correctly formatted.

### Test 2: Empty Data
Remove all rows - should display "No Transfer Recommendations" message.

### Test 3: Missing Columns
Remove optional columns like `distance` - should still render with "—" placeholders.

### Test 4: Null Values
Set some values to null - should handle gracefully with fallback values.

### Test 5: Button Click
Click "Initiate Transfer Request" - should set Sigma variables and log to console.

## Debugging

Open browser developer console to see:
- Data loading messages
- Number of recommendations processed
- Variable setting confirmations
- Any errors or warnings

## Verification Checklist

- [ ] Cards display with correct product names
- [ ] Red shortage sections show critical inventory
- [ ] Green excess sections show overstocked inventory
- [ ] Transfer arrow shows recommended quantity
- [ ] Trend arrows point correct direction (↗️ up, ↘️ down)
- [ ] Numbers formatted with commas
- [ ] Button click sets Sigma variables
- [ ] Empty state displays when no data
- [ ] Cards are responsive and properly spaced
- [ ] Hover effects work on cards and buttons

