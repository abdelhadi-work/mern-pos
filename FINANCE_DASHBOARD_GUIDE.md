# Finance Dashboard - Complete Feature Guide

## 📊 Overview

The Finance Dashboard is a comprehensive analytics platform for real-time business performance monitoring. It provides deep insights into sales, expenses, profitability, inventory, cashflow, and automated alerts.

**Access**: `http://localhost:5173/finance`  
**Roles**: `finance_admin`, `main_admin`, `accounting_admin`

---

## 🎯 Core Features (Phases 1-3)

### 1. **Real-Time KPIs**
- Revenue (total sales)
- Orders count
- Average order value
- Items sold

### 2. **Sales & Orders Time Series**
- Interactive line/area chart
- Daily/weekly/monthly aggregation
- Hover tooltips with exact values
- Grid lines and axes
- CSV export

### 3. **Payment Mix Analysis**
- Donut chart visualization
- Breakdown by payment method (Cash, Card, Split, Transfer, Credit)
- Percentage distribution
- Total amount per method

### 4. **Profit Analytics**
- **Gross Profit**: Revenue - COGS
- **COGS**: Cost of goods sold
- **Gross Margin %**: (Gross Profit / Revenue) × 100
- **Expenses**: Total operational expenses
- **Net Profit**: Gross Profit - Expenses
- **Net Margin %**: (Net Profit / Revenue) × 100

### 5. **Inventory Metrics**
- **Stock Value**: Current inventory value (stock × cost price)
- **Inventory Turnover**: COGS ÷ Average Inventory Value
- **Days of Inventory**: 365 ÷ Turnover ratio

### 6. **Category & Product Profit**
- Top categories by margin
- Top products by margin %
- Revenue, COGS, Gross Profit breakdown
- View All / Show Less toggles
- CSV export for each

### 7. **Recent Orders & Expenses**
- Paginated tables (10/20/50 per page)
- Order details: Number, Status, Payment, Cashier, Total, Date
- Expense details: Date, Category, Description, Amount, Branch
- CSV export
- Zebra-striped rows with hover effects

---

## 🚀 Advanced Features (Phase 4)

### 8. **💰 Cashflow Analysis**

**What it shows:**
- Daily cash inflows from sales (by payment method)
- Daily cash outflows from expenses (by category)
- Net cashflow per day (inflow - outflow)
- Cumulative cashflow over time

**Key Metrics:**
- **Total Inflow**: Sum of all cash received
- **Total Outflow**: Sum of all expenses
- **Net Cashflow**: Total Inflow - Total Outflow
- **Burn Rate**: Average daily outflow
- **Runway Days**: How long cash will last at current burn rate

**Visualization:**
- Dual-bar chart (green bars = inflow, red bars = outflow)
- Grid lines with currency labels
- Date labels on X-axis
- Legend for clarity

**Use Cases:**
- Monitor daily cash position
- Identify cash-intensive days
- Plan for cash shortfalls
- Optimize payment collection timing

---

### 9. **📊 Comparative Analytics**

**What it compares:**
- Current period vs Previous period (same duration)
- Metrics: Revenue, Orders, Average Order Value

**How it works:**
- Select a date range (e.g., Jan 1-15)
- System automatically compares to previous period (Dec 17-31)
- Shows percentage change with trend arrows

**Visual Indicators:**
- ↑ Green arrow = Growth
- ↓ Red arrow = Decline
- Percentage change displayed prominently

**Use Cases:**
- Track month-over-month growth
- Identify declining trends early
- Compare seasonal performance
- Measure impact of promotions

---

### 10. **🔔 Alerts & Thresholds**

**Automated Detection:**

#### a) **Low Inventory Alerts**
- Triggers when product stock < 10 units
- **Critical** (red): Stock = 0
- **High** (orange): Stock < 5
- **Medium** (yellow): Stock < 10
- Shows product name and current stock

#### b) **Declining Margin Warnings**
- Compares last 7 days vs previous 7 days
- Triggers if gross margin drops by 5%+
- **High** (orange): > 10% decline
- **Medium** (yellow): 5-10% decline
- Shows current margin, previous margin, and change

#### c) **Expense Anomaly Detection**
- Detects daily expenses > 2× average (last 30 days)
- **Medium** (yellow): All anomalies
- Shows date, amount, and average for comparison

**Alert Panel:**
- Color-coded severity badges
- Left border accent matching severity
- Badge count showing total alerts
- Top 5 most critical alerts displayed
- Auto-hides when no alerts

**Use Cases:**
- Prevent stockouts
- Catch margin erosion early
- Identify unusual expense spikes
- Proactive issue resolution

---

### 11. **🔍 Advanced Filtering**

#### Quick Date Ranges
One-click presets for common time periods:

| Button | Range |
|--------|-------|
| **Last 7d** | Past 7 days |
| **Last 30d** | Past 30 days |
| **Today** | Current day (00:00 to 23:59) |
| **Yesterday** | Previous day |
| **MTD** | Month-to-Date (1st to now) |
| **YTD** | Year-to-Date (Jan 1 to now) |
| **Last 90d** | Past 90 days |

#### Custom Date Range
- Start date picker
- End date picker
- Automatically sets time boundaries (00:00 and 23:59)

#### Filter Dimensions
- **Status**: All, Completed, Pending, Cancelled, Refunded
- **Payment Method**: All, Cash, Card, Split, Transfer, Credit
- **Category**: All categories (dynamic from database)
- **Cashier**: All cashiers (for main_admin only)
- **Branch**: All branches (multi-location support)

#### Filter Presets (Save/Load)
- **Save current filters** with custom name
- **Load saved presets** with one click
- **Delete presets** individually
- **LocalStorage persistence** (survives page refresh)
- **Preset count badge** on button
- **Dropdown menu** interface

**How to use:**
1. Apply desired filters
2. Click "📌 Presets" button
3. Enter preset name (e.g., "Q4 Sales Report")
4. Click "Save"
5. Load anytime from dropdown

**Use Cases:**
- Save monthly report filters
- Quick access to favorite views
- Share filter configurations (via screenshot)
- Consistent reporting periods

---

## 🎨 User Interface

### Design Principles
- **Professional & Classic**: Clean, business-focused design
- **Color-Coded**: Green (positive), Red (negative), Yellow (warning), Blue (info)
- **Responsive**: Works on desktop and tablets
- **Consistent**: Uniform button styles, spacing, typography

### Interactive Elements
- **Hover effects**: All buttons, table rows, chart elements
- **Loading states**: Skeleton screens during data fetch
- **Empty states**: Friendly messages when no data
- **Tooltips**: Chart hover shows exact values

### Tables
- **Zebra striping**: Alternating row colors (#fff / #f8fafc)
- **Hover highlight**: Light blue (#eef2ff)
- **Sticky headers**: (for future implementation)
- **Pagination controls**: Prev/Next buttons with page info

### Charts
- **SVG-based**: No external libraries, lightweight
- **Grid lines**: Clear data reference
- **Axes labels**: Currency formatting, date formatting
- **Legends**: Color key for multi-series charts
- **Responsive**: Scales to container width

---

## ⚙️ Technical Details

### Backend Architecture
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Aggregation**: MongoDB aggregation pipelines
- **Authentication**: JWT-based with role authorization
- **CSV Export**: Server-side generation

### Frontend Architecture
- **Framework**: React.js (functional components)
- **Routing**: React Router v6
- **State Management**: React hooks (useState, useMemo, useEffect)
- **API Client**: Axios
- **URL Persistence**: useSearchParams hook
- **Local Storage**: Filter presets

### Performance Optimizations
- **Memoized params**: Prevent unnecessary re-renders
- **Conditional fetching**: Only fetch when needed
- **Lazy loading**: Charts render only with data
- **Debounced filters**: (for future implementation)
- **Indexed queries**: MongoDB indexes on date, branch, status

### Data Flow
1. User applies filters → URL updates
2. URL change triggers `useEffect`
3. `useFetch` hook calls API with params
4. Backend aggregates data from MongoDB
5. Response updates component state
6. UI re-renders with new data

---

## 📈 Use Cases & Scenarios

### Daily Operations
- Check today's revenue and orders
- Monitor low-stock products
- Review recent expenses
- Track cashflow position

### Weekly Review
- Compare this week vs last week
- Identify top-performing products
- Review margin trends
- Check for expense anomalies

### Monthly Reporting
- Generate MTD reports
- Compare to previous month
- Export all data to CSV
- Save filters as "Monthly Report" preset

### Strategic Planning
- Analyze YTD performance
- Track inventory turnover
- Calculate burn rate and runway
- Identify declining margins early

### Multi-Branch Management
- Filter by specific branch
- Compare branch performance
- Allocate inventory based on turnover
- Monitor branch-specific expenses

---

## 🔐 Security & Access Control

### Role-Based Access
- **finance_admin**: Full access to Finance Dashboard
- **main_admin**: Full access + user management
- **accounting_admin**: Full access (accounting focus)
- **Other roles**: No access (redirected)

### Data Privacy
- Users only see data for their authorized branches
- Cashier filter only visible to main_admin
- Expense data restricted by role
- JWT token required for all API calls

### Audit Trail
- All API calls logged (for future implementation)
- User actions tracked (for future implementation)
- Export history maintained (for future implementation)

---

## 📊 Export Capabilities

### Individual Exports
- **Time Series CSV**: Date, Sales, Orders
- **Orders CSV**: Order details with filters applied
- **Category Profit CSV**: All categories with metrics
- **Product Profit CSV**: All products with metrics
- **Expenses CSV**: All expenses with filters applied

### Bulk Export
- **"Export All CSV" button**: Downloads all 5 CSVs at once
- Respects current filters
- Sequential downloads (prevents browser blocking)
- Custom filenames for easy identification

### CSV Format
- **Headers**: Clear column names
- **Data**: Properly formatted (currency, dates, etc.)
- **Encoding**: UTF-8
- **Delimiter**: Comma
- **Compatible**: Excel, Google Sheets, Numbers

---

## 🔄 Auto-Refresh

**Feature**: Checkbox in top bar  
**Interval**: 60 seconds  
**Behavior**: Refreshes all data automatically  
**Use Case**: Real-time monitoring on wall-mounted displays

**How to use:**
1. Check "Auto-refresh (60s)" box
2. Dashboard updates every minute
3. Uncheck to stop auto-refresh

---

## 🐛 Troubleshooting

### No data showing
- Check date range (may be too narrow)
- Verify branch filter (may exclude all data)
- Ensure orders exist in database
- Check browser console for errors

### Alerts not appearing
- Alerts only show when conditions are met
- Check inventory levels (must be < 10)
- Verify expense data exists (for anomaly detection)
- Ensure 14+ days of order history (for margin comparison)

### Presets not saving
- Check browser localStorage is enabled
- Clear localStorage if corrupted: `localStorage.clear()`
- Ensure preset name is not empty
- Try different browser if issue persists

### Charts not rendering
- Ensure data is not empty
- Check browser console for errors
- Verify SVG support in browser
- Try hard refresh (Ctrl+Shift+R)

---

## 🎯 Best Practices

### For Daily Use
1. Start with "Today" quick filter
2. Check alerts panel first
3. Review cashflow summary
4. Monitor recent orders/expenses

### For Weekly Reports
1. Use "Last 7d" quick filter
2. Enable comparative analytics
3. Export all CSVs
4. Save as "Weekly Report" preset

### For Monthly Analysis
1. Use "MTD" quick filter
2. Review all profit metrics
3. Check inventory turnover
4. Compare to previous month

### For Strategic Planning
1. Use "YTD" or "Last 90d" filter
2. Analyze trends in comparative view
3. Review cashflow runway
4. Export data for external analysis

---

## 🚀 Future Enhancements (Phase 5+)

### Planned Features
- Interactive chart drill-down
- Dashboard widget customization
- Mobile app version
- Scheduled email reports
- PDF export with branding
- Advanced forecasting
- Budget vs actual tracking
- Multi-currency support
- Custom alert thresholds
- Real-time notifications

---

## 📞 Support

For issues or feature requests, contact:
- **Technical Lead**: [Your Name]
- **Email**: [Your Email]
- **Documentation**: `/PHASE4_FEATURES.md`

---

**Last Updated**: November 8, 2025  
**Version**: 4.0  
**Status**: Production Ready ✅

