# Transfer Recommendation Card Plugin

A Sigma Computing plugin that displays inventory transfer recommendations in an intuitive card-based layout.

## Overview

This plugin visualizes transfer opportunities between stores with shortage (critical/high risk) and stores with excess inventory (overstocked). Each card shows:

- **Product Information**: Name and SKU
- **Shortage Store**: Critical inventory metrics (current qty, needed, days supply, trend)
- **Transfer Recommendation**: Suggested quantity to transfer
- **Excess Store**: Overstocked inventory metrics (current qty, available, days supply, trend)
- **Action Button**: Initiates transfer request workflow

## Data Requirements

The plugin accepts **raw inventory snapshot data** and automatically processes it into transfer recommendations.

### Required Columns

#### Product Information
- `product_key` - Unique product identifier
- `product_name` - Full product name (e.g., "Sony WH-1000XM5 Headphones")
- `sku_number` - Stock keeping unit (e.g., "AU-SO-0000000608")

#### Store Information
- `store_name` - Store name (e.g., "Big Buys Los Angeles #100010")
- `store_city` - City name

#### Inventory Metrics
- `quantity_on_hand` - Current inventory level
- `reorder_point` - Minimum inventory threshold
- `days_of_supply` - How many days current inventory will last
- `stockout_risk` - Risk level: 'Critical', 'High', or 'Overstocked'

#### Sales Metrics (for trend calculation)
- `avg_daily_sales_30d` - Average daily sales over last 30 days
- `avg_daily_sales_90d` - Average daily sales over last 90 days

### How It Works

The plugin automatically:
1. **Identifies shortage stores** - Filters for stockout_risk = 'Critical' or 'High'
2. **Identifies excess stores** - Filters for stockout_risk = 'Overstocked'
3. **Matches products** - Joins shortage and excess stores by product_key
4. **Calculates metrics**:
   - shortage_needed = reorder_point - quantity_on_hand
   - excess_available = quantity_on_hand - (avg_daily_sales_30d × 30)
   - shortage_trend & excess_trend = % change from 90d to 30d sales
   - recommended_transfer_qty = min(shortage_needed, excess_available, 100)
5. **Filters & sorts** - Shows most urgent shortages first

## Setting Up in Sigma

### Quick Setup (Recommended)

Simply upload your CSV or point to your inventory table - the plugin handles everything else!

1. **Upload Data**: Upload `Base for Recommendations Plugin.csv` to Sigma
2. **Add Plugin**: Insert the Transfer Recommendation Card plugin
3. **Configure**: Select your data source in the plugin config panel
4. **Done!** Transfer recommendations appear automatically

### Alternative: Pre-Process with SQL (Optional)

If you prefer to pre-process the data in Sigma with SQL, you can use this query:

```sql
WITH shortage AS (
  SELECT 
    snapshot_date,
    store_name as shortage_store_name,
    store_city as shortage_city,
    product_key,
    product_name,
    sku_number,
    quantity_on_hand as shortage_qty,
    reorder_point - quantity_on_hand as shortage_needed,
    days_of_supply as shortage_days,
    ROUND((avg_daily_sales_30d - avg_daily_sales_90d) / NULLIF(avg_daily_sales_90d, 0) * 100, 0) as shortage_trend
  FROM inventory_snapshots
  WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM inventory_snapshots)
    AND stockout_risk IN ('Critical', 'High')
),
excess AS (
  SELECT 
    snapshot_date,
    store_name as excess_store_name,
    store_city as excess_city,
    product_key,
    quantity_on_hand as excess_qty,
    quantity_on_hand - (avg_daily_sales_30d * 30) as excess_available,
    days_of_supply as excess_days,
    ROUND((avg_daily_sales_30d - avg_daily_sales_90d) / NULLIF(avg_daily_sales_90d, 0) * 100, 0) as excess_trend
  FROM inventory_snapshots
  WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM inventory_snapshots)
    AND stockout_risk = 'Overstocked'
    AND avg_daily_sales_30d > 0
)
SELECT 
  s.product_name,
  s.sku_number,
  s.shortage_store_name,
  s.shortage_city,
  s.shortage_qty,
  s.shortage_needed,
  s.shortage_days,
  s.shortage_trend,
  e.excess_store_name,
  e.excess_city,
  e.excess_qty,
  e.excess_available,
  e.excess_days,
  e.excess_trend,
  LEAST(s.shortage_needed, e.excess_available, 100) as recommended_transfer_qty
FROM shortage s
INNER JOIN excess e 
  ON s.product_key = e.product_key
  AND s.snapshot_date = e.snapshot_date
WHERE e.excess_available > 10
ORDER BY s.shortage_days ASC
LIMIT 50;
```

Note: This is optional - the plugin can process raw data automatically.

## Plugin Configuration

### In Sigma Workbook:

1. **Add Plugin Element**: Insert the Transfer Recommendation Card plugin
2. **Configure Data Source**: Select your inventory data (CSV or table)
3. **Style Options**:
   - `minCardWidth`: Choose card width (400px, 500px, 600px, or 700px)
   - `containerPadding`: Choose padding (0rem, 1rem, or 2rem)
   - `maxRecommendations`: Limit number of cards (10, 25, 50, or 100)

**No column mapping required!** The plugin automatically finds columns by name.

### Setting Up the Transfer Modal:

The plugin sets the following Sigma variables when "Initiate Transfer Request" is clicked:

- `selected_product` - Product name
- `selected_sku` - SKU number
- `from_store` - Excess store name
- `to_store` - Shortage store name
- `transfer_quantity` - Recommended transfer quantity
- `transfer_modal_trigger` - Timestamp trigger for opening modal

Create a Sigma action chain that:
1. Listens for changes to `transfer_modal_trigger` variable
2. Opens a modal/page with transfer form
3. Pre-fills form fields using the other variables

## Design Specifications

### Color Scheme
Based on the inventory planning dashboard mockup:

- **Critical Red**: #DC2626 (background: #FEE2E2)
- **Success Green**: #10B981 (background: #D1FAE5)
- **Warning Amber**: #F59E0B
- **Primary Blue**: #3B82F6

### Layout
- Responsive grid layout with auto-fit columns
- Cards have hover effects with shadow elevation
- Rounded corners and smooth transitions
- Mobile-friendly with single column on small screens

## Development

### File Structure
```
src/
├── App.tsx                      # Main plugin entry, data transformation
├── App.css                      # Base styles and utilities
└── components/
    ├── TransferCard.tsx         # Individual card component
    └── TransferCardGrid.tsx     # Grid layout and empty states
```

### Key Technologies
- React with TypeScript
- Sigma Plugin SDK (`@sigmacomputing/plugin`)
- Tailwind CSS utility classes
- D3.js for number formatting

### Building
Follow standard Sigma plugin development workflow:
1. Install dependencies: `npm install`
2. Start dev server: `npm start`
3. Build for production: `npm run build`

## Example Use Cases

### Scenario 1: Sony Headphones
- **Shortage**: Big Buys LA has 2 units, needs 28, 2.9 days supply
- **Excess**: Big Buys Pacoima has 120 units, 857 days supply
- **Recommendation**: Transfer 50 units

### Scenario 2: Apple AirPods
- **Shortage**: Big Buys Norwalk has 5 units, needs 22, 2.4 days supply
- **Excess**: Big Buys LA Premium has 120 units, 293 days supply
- **Recommendation**: Transfer 40 units

## Support

For issues or questions:
- Review the `SIGMA_BUILD_GUIDE.md` for dashboard setup
- Check `SIGMA_FORMULAS.md` for metric calculations
- See `dashboard_mockup.html` for visual reference

## Version History

- **v1.0.0** - Initial release with transfer recommendation cards

