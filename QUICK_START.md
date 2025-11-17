# Quick Start Guide

Get your Transfer Recommendation Card plugin running in Sigma in 5 minutes!

## Step 1: Prepare Your Data (30 seconds)

**Option A: Upload the CSV directly to Sigma**
- Simply upload your `Base for Recommendations Plugin.csv` file
- The plugin will automatically process the raw inventory data

**Option B: Use your existing inventory table**
- Point the plugin to your inventory snapshot table
- Must include these columns:
  - `product_key`, `product_name`, `sku_number`
  - `store_name`, `store_city`
  - `quantity_on_hand`, `reorder_point`, `days_of_supply`
  - `avg_daily_sales_30d`, `avg_daily_sales_90d`
  - `stockout_risk` (values: 'Critical', 'High', 'Overstocked')

**That's it!** The plugin automatically:
- Identifies shortage stores (Critical/High risk)
- Identifies excess stores (Overstocked)
- Matches products between stores
- Calculates transfer recommendations
- No SQL required!

## Step 2: Add Plugin Instances (1 min per card)

**Important**: Each plugin instance shows ONE transfer recommendation card.
- For Sony headphones: Add plugin #1, set cardIndex = 1
- For Apple AirPods: Add plugin #2, set cardIndex = 2
- Continue for more recommendations...

1. In your Sigma workbook, click **+ Add** → **Plugin**
2. Select **Transfer Recommendation Card**
3. Position it on your page
4. **Repeat** to add more cards (one plugin instance per card)

## Step 3: Configure Each Plugin (30 seconds per card)

### Data Source
- **source**: Select your inventory data (CSV upload or table)

### Display Options
- **cardIndex**: Which recommendation to show (1 = most urgent, 2 = second most urgent, etc.)
- **containerPadding**: Spacing around the card (0rem, 1rem, or 2rem)

**No column mapping needed!** The plugin automatically:
- Finds required columns by name
- Identifies shortage/excess stores
- Calculates transfer recommendations
- Sorts by urgency (lowest days supply first)

## Step 4: Set Up the Transfer Modal (1 min)

Create these Sigma variables (Control → Variable):

1. `selected_product` (text)
2. `selected_sku` (text)
3. `from_store` (text)
4. `to_store` (text)
5. `transfer_quantity` (number)
6. `transfer_modal_trigger` (text)

## Step 5: Test It! (30 sec)

1. **View the cards** - You should see transfer recommendations
2. **Click a button** - "Initiate Transfer Request"
3. **Check console** - Open browser dev tools (F12) to see:
   ```
   Initiating transfer: {...}
   Transfer variables set successfully
   ```

## ✅ You're Done!

Your plugin is now displaying transfer recommendations. 

## Next Steps (Optional)

### Create a Transfer Modal

1. **Add a Modal Page**:
   - Create a new page in your workbook
   - Name it "Transfer Form"
   - Add input fields mapped to the variables

2. **Add Action Chain**:
   - On the main page, create an action
   - Trigger: When `transfer_modal_trigger` changes
   - Action: Navigate to "Transfer Form" page

3. **Pre-fill the Form**:
   - Use the variables to populate form fields:
     - Product: `{{ selected_product }}`
     - SKU: `{{ selected_sku }}`
     - From: `{{ from_store }}`
     - To: `{{ to_store }}`
     - Quantity: `{{ transfer_quantity }}`

## Troubleshooting

### No cards showing?
- Check that your SQL query returns data
- Verify column mappings are correct
- Open console (F12) to see error messages

### Button doesn't work?
- Check console for errors
- Verify variables are created in Sigma
- Make sure variable names match exactly

### Cards look wrong?
- Verify all required columns are mapped
- Check for null values in your data
- Try different minCardWidth settings

## Sample Data for Testing

If you don't have inventory data yet, use this CSV:

```csv
product_name,sku_number,shortage_store_name,shortage_city,shortage_qty,shortage_needed,shortage_days,shortage_trend,excess_store_name,excess_city,excess_qty,excess_available,excess_days,excess_trend,recommended_transfer_qty
Sony WH-1000XM5 Headphones,AU-SO-0000000608,Big Buys Los Angeles #100010,"Los Angeles, CA",2,28,2.9,27,Big Buys Premium Pacoima #100019,"Pacoima, CA",120,90,857,-30,50
Apple AirPods Pro Series,AU-APPLE-0000000571,Big Buys Flagship Norwalk #100013,"Norwalk, CA",5,22,2.4,41,Big Buys Premium LA #100021,"Los Angeles, CA",120,85,293,-20,40
```

Upload this as a CSV, then use it as your data source.

## Need More Help?

- See **README.md** for complete documentation
- See **SAMPLE_DATA.md** for testing guide
- See **IMPLEMENTATION_SUMMARY.md** for technical details

## Demo Scenario

With the sample data above, you should see:

**Card 1**: Sony headphones  
- Shortage: LA store has 2 units, needs 28, 2.9 days supply (critical!)
- Transfer: 50 units recommended
- Excess: Pacoima store has 120 units, 857 days supply (way overstocked!)

**Card 2**: Apple AirPods  
- Shortage: Norwalk store has 5 units, needs 22, 2.4 days supply
- Transfer: 40 units recommended
- Excess: LA Premium has 120 units, 293 days supply

This matches the inventory planning demo scenarios! 🎉

