# Recipe Price Manager - Phase 1

## Overview
The Recipe Price Manager is a new feature that transforms the existing pricing simulation into actual price management functionality. This Phase 1 implementation provides basic price management with comprehensive price history tracking.

## Features Implemented

### 1. Price Management Dashboard
- **Recipe List View**: Display all recipes with current prices, COGS, and profit margins
- **Search & Filter**: Find recipes by name or SKU
- **Price Overview**: Quick view of current pricing status for each recipe

### 2. Price Update Functionality
- **Multiple Update Methods**:
  - Manual price input
  - Markup-based calculation (percentage over COGS)
  - Target profit margin calculation
- **Real-time Preview**: See price changes, percentage changes, and new profit margins before saving
- **Reason Tracking**: Optional field to document why prices were changed

### 3. Price History Tracking
- **Complete Audit Trail**: Track all price changes with timestamps
- **Change Analysis**: View price differences, percentage changes, and change types
- **Reason Documentation**: See why each price change was made
- **Visual Indicators**: Color-coded changes (green for increases, red for decreases)

### 4. User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Intuitive Navigation**: Easy access from sidebar and recipes page
- **Visual Feedback**: Clear indicators for profit margins and price changes
- **Export Ready**: Data can be exported for external analysis

## Technical Implementation

### Database Schema
- **RecipePriceHistory Model**: Stores all price change records
- **Relations**: Links to Recipe and Business models
- **Audit Fields**: Timestamps, change types, and reasons

### API Endpoints
- `POST /api/recipes/[id]/price` - Update recipe price
- `GET /api/recipes/[id]/price-history` - Fetch price history

### Components
- `RecipePriceManagerPage` - Main price management interface
- `PriceHistoryDialog` - Display price change history
- `PriceUpdateDialog` - Update recipe prices

## Usage

### Accessing Price Manager
1. **Sidebar Navigation**: Click "Price Manager" in the main sidebar
2. **Recipes Page**: Click "Price Manager" button next to "Tambah Resep"
3. **Direct URL**: Navigate to `/price/price-manager`

### Updating Recipe Prices
1. Click "Update Price" button for any recipe
2. Choose update method:
   - **Manual**: Enter exact price
   - **Markup**: Set percentage over COGS
   - **Target Margin**: Set desired profit margin
3. Add optional reason for the change
4. Review preview of changes
5. Click "Update Price" to save

### Viewing Price History
1. Click "Price History" button for any recipe
2. View complete timeline of price changes
3. See detailed information about each change
4. Understand pricing trends over time

## Business Benefits

### Immediate Value
- **Centralized Pricing**: All recipe prices in one place
- **Audit Trail**: Complete history of price decisions
- **Quick Updates**: Easy price adjustments with multiple calculation methods
- **Profit Visibility**: Clear view of profit margins across all recipes

### Strategic Insights
- **Pricing Trends**: Track how prices evolve over time
- **Decision Documentation**: Remember why prices were changed
- **Margin Analysis**: Monitor profit margin health across recipes
- **Historical Context**: Understand pricing decisions in business context

## Future Enhancements (Phase 2 & 3)

### Phase 2: Pricing Strategies & Automation
- Bulk pricing operations
- Automated price adjustments based on ingredient costs
- Pricing rules and policies
- Seasonal pricing adjustments

### Phase 3: Advanced Analytics & Reporting
- Price trend analysis
- Profit margin reporting
- Competitive pricing insights
- Revenue impact analysis

## Technical Notes

### Dependencies
- Uses existing Prisma schema and database
- Integrates with current authentication system
- Leverages existing UI components and styling
- Compatible with current business logic

### Performance
- Efficient database queries with proper indexing
- Lazy loading of price history data
- Optimized for large recipe collections
- Responsive UI with smooth interactions

### Security
- Business-scoped data access
- User authentication required
- Audit logging for all price changes
- Input validation and sanitization

## Support

For technical support or feature requests related to the Price Manager, please refer to the project documentation or contact the development team.

---

**Version**: Phase 1  
**Last Updated**: September 2025  
**Status**: Production Ready
