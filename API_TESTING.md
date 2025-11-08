# 🧪 API Testing Guide - MERN POS System

## 📋 Table of Contents
1. [Authentication Tests](#authentication-tests)
2. [Category Tests](#category-tests)
3. [Product Tests](#product-tests)
4. [Order Tests](#order-tests)
5. [Delivery Tests](#delivery-tests)
6. [Analytics Tests](#analytics-tests)
7. [Branch Tests](#branch-tests)
8. [Expense Tests](#expense-tests)
9. [Settings Tests](#settings-tests)
10. [Frontend Testing](#frontend-testing)

---

## 🔐 Authentication Tests

### 1. Login Test
```bash
# Test login endpoint
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Expected Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "_id": "...",
#     "username": "admin",
#     "fullName": "Admin User",
#     "role": "main_admin"
#   }
# }
```

### 2. Get All Users (Admin Only)
```bash
# Replace YOUR_TOKEN with actual token from login
curl -X GET http://localhost:5001/api/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "users": [...]
# }
```

### 3. Register New User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "fullName": "Test User",
    "role": "cashier"
  }'
```

---

## 📁 Category Tests

### 1. Get All Categories
```bash
curl -X GET http://localhost:5001/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "categories": [...]
# }
```

### 2. Create Category
```bash
curl -X POST http://localhost:5001/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Category" \
  -F "description=Test Description" \
  -F "image=@/path/to/image.jpg"
```

### 3. Update Category
```bash
curl -X PUT http://localhost:5001/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Updated Category" \
  -F "description=Updated Description"
```

### 4. Delete Category
```bash
curl -X DELETE http://localhost:5001/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Product Tests

### 1. Get All Products
```bash
curl -X GET "http://localhost:5001/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters:
curl -X GET "http://localhost:5001/api/products?category=CATEGORY_ID&search=laptop" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Low Stock Products
```bash
curl -X GET http://localhost:5001/api/products/lowstock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create Product
```bash
curl -X POST http://localhost:5001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Product" \
  -F "sku=TEST-001" \
  -F "category=CATEGORY_ID" \
  -F "price=99.99" \
  -F "cost=50.00" \
  -F "stock=100" \
  -F "lowStockThreshold=10" \
  -F "description=Test product description" \
  -F "image=@/path/to/product.jpg"
```

### 4. Update Product
```bash
curl -X PUT http://localhost:5001/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Updated Product" \
  -F "price=109.99" \
  -F "stock=150"
```

### 5. Delete Product
```bash
curl -X DELETE http://localhost:5001/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛒 Order Tests

### 1. Get All Orders
```bash
curl -X GET "http://localhost:5001/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters:
curl -X GET "http://localhost:5001/api/orders?status=completed&paymentMethod=cash&startDate=2024-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Today's Sales
```bash
curl -X GET http://localhost:5001/api/orders/today \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "totalSales": 1500.00,
#   "totalOrders": 25,
#   "orders": [...]
# }
```

### 3. Create Order
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "paymentMethod": "cash",
    "total": 199.98,
    "subtotal": 199.98,
    "tax": 0,
    "discount": 0
  }'
```

### 4. Cancel Order
```bash
curl -X PUT http://localhost:5001/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

### 5. Refund Order
```bash
curl -X POST http://localhost:5001/api/orders/ORDER_ID/refund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Product defective",
    "amount": 199.98
  }'
```

---

## 🚚 Delivery Tests

### 1. Get My Delivery Orders (Delivery User)
```bash
# Login as delivery user first
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "delivery_user",
    "password": "password123"
  }'

# Then get orders
curl -X GET http://localhost:5001/api/delivery/my-orders \
  -H "Authorization: Bearer DELIVERY_USER_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "orders": [
#     {
#       "_id": "...",
#       "orderNumber": "ORD-001",
#       "guestCustomer": {...},
#       "items": [...],
#       "delivery": {
#         "status": "pending",
#         "assignedTo": "..."
#       }
#     }
#   ]
# }
```

### 2. Update Delivery Status
```bash
# Start delivery
curl -X PUT http://localhost:5001/api/delivery/ORDER_ID/status \
  -H "Authorization: Bearer DELIVERY_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "out_for_delivery"
  }'

# Mark as delivered
curl -X PUT http://localhost:5001/api/delivery/ORDER_ID/status \
  -H "Authorization: Bearer DELIVERY_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered"
  }'
```

---

## 📊 Analytics Tests

### 1. Get Dashboard Snapshot (All Data in One Call)
```bash
curl -X GET "http://localhost:5001/api/analytics/dashboard?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response: All dashboard data including:
# - summary (revenue, orders, avg order value)
# - timeseries (sales over time)
# - paymentMix (payment method breakdown)
# - orders (recent orders)
# - profitSummary (gross profit, margins)
# - categoryProfit (profit by category)
# - productProfit (profit by product)
# - inventoryMetrics (stock value, turnover)
# - cashflowData (inflows, outflows)
# - comparativeData (period comparison)
# - alertsData (low stock, declining margin alerts)
```

### 2. Get Summary
```bash
curl -X GET "http://localhost:5001/api/analytics/summary?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "totalRevenue": 50000.00,
#   "totalOrders": 250,
#   "avgOrderValue": 200.00,
#   "totalCustomers": 150
# }
```

### 3. Get Time Series Data
```bash
curl -X GET "http://localhost:5001/api/analytics/timeseries?start=2024-01-01&end=2024-12-31&interval=day" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Intervals: day, week, month, auto
```

### 4. Get Payment Mix
```bash
curl -X GET "http://localhost:5001/api/analytics/payment-mix?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "paymentMix": [
#     { "_id": "cash", "count": 100, "total": 15000 },
#     { "_id": "card", "count": 80, "total": 20000 },
#     { "_id": "mobile", "count": 70, "total": 15000 }
#   ]
# }
```

### 5. Get Profit Summary
```bash
curl -X GET "http://localhost:5001/api/analytics/profit/summary?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "totalRevenue": 50000.00,
#   "totalCost": 30000.00,
#   "totalExpenses": 5000.00,
#   "grossProfit": 20000.00,
#   "netProfit": 15000.00,
#   "grossMarginPct": 40.00,
#   "netMarginPct": 30.00
# }
```

### 6. Get Category Profit
```bash
curl -X GET "http://localhost:5001/api/analytics/profit/categories?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Get Product Profit
```bash
curl -X GET "http://localhost:5001/api/analytics/profit/products?limit=10&sort=marginPct" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sort options: revenue, profit, marginPct, unitsSold
```

### 8. Get Inventory Metrics
```bash
curl -X GET "http://localhost:5001/api/analytics/inventory?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "currentStockValue": 25000.00,
#   "inventoryTurnover": 4.5,
#   "daysOfInventory": 81
# }
```

### 9. Get Cashflow Analysis
```bash
curl -X GET "http://localhost:5001/api/analytics/cashflow?start=2024-01-01&end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "dailyFlow": [
#     { "date": "2024-01-01", "inflow": 1500, "outflow": 500, "net": 1000 }
#   ],
#   "totalInflow": 50000,
#   "totalOutflow": 15000,
#   "netCashflow": 35000,
#   "avgDailyBurn": 41.67,
#   "runway": 840
# }
```

### 10. Get Comparative Analytics
```bash
curl -X GET "http://localhost:5001/api/analytics/comparative?start=2024-06-01&end=2024-06-30" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "current": { "revenue": 5000, "orders": 50, "avgOrderValue": 100 },
#   "previous": { "revenue": 4500, "orders": 45, "avgOrderValue": 100 },
#   "changes": { "revenuePct": 11.11, "ordersPct": 11.11, "avgOrderValuePct": 0 }
# }
```

### 11. Get Alerts
```bash
curl -X GET http://localhost:5001/api/analytics/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "alerts": [
#     {
#       "type": "low_inventory",
#       "severity": "high",
#       "message": "5 products below threshold",
#       "products": [...]
#     },
#     {
#       "type": "declining_margin",
#       "severity": "medium",
#       "message": "Margin dropped 15% in last 7 days"
#     }
#   ]
# }
```

---

## 🏢 Branch Tests

### 1. Get All Branches
```bash
curl -X GET http://localhost:5001/api/branches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create Branch
```bash
curl -X POST http://localhost:5001/api/branches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Branch",
    "address": "123 Main St, City",
    "phone": "+1234567890",
    "isActive": true
  }'
```

### 3. Update Branch
```bash
curl -X PUT http://localhost:5001/api/branches/BRANCH_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Branch - Updated",
    "isActive": true
  }'
```

### 4. Delete Branch
```bash
curl -X DELETE http://localhost:5001/api/branches/BRANCH_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💰 Expense Tests

### 1. Get All Expenses
```bash
curl -X GET "http://localhost:5001/api/expenses?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters:
curl -X GET "http://localhost:5001/api/expenses?category=rent&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create Expense
```bash
curl -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "category": "rent",
    "date": "2024-01-01",
    "description": "Monthly office rent",
    "branch": "BRANCH_ID"
  }'
```

### 3. Update Expense
```bash
curl -X PUT http://localhost:5001/api/expenses/EXPENSE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1600.00,
    "description": "Monthly office rent - updated"
  }'
```

### 4. Delete Expense
```bash
curl -X DELETE http://localhost:5001/api/expenses/EXPENSE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚙️ Settings Tests

### 1. Get Profile
```bash
curl -X GET http://localhost:5001/api/settings/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Update Profile
```bash
curl -X PUT http://localhost:5001/api/settings/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "email": "newemail@example.com"
  }'
```

### 3. Get Security Settings
```bash
curl -X GET http://localhost:5001/api/settings/security \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update Security Settings
```bash
curl -X PUT http://localhost:5001/api/settings/security \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "newpass123",
    "twoFactorEnabled": true
  }'
```

### 5. Get Storefront Settings
```bash
curl -X GET http://localhost:5001/api/settings/storefront \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Update Storefront Settings
```bash
curl -X PUT http://localhost:5001/api/settings/storefront \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "My Electronics Store",
    "storeDescription": "Best electronics in town",
    "currency": "USD",
    "taxRate": 8.5
  }'
```

---

## 🌐 Frontend Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Logout functionality
- [ ] Token persistence (refresh page while logged in)
- [ ] Protected routes redirect to login when not authenticated

#### Dashboard
- [ ] Dashboard loads all KPI cards
- [ ] Charts render correctly
- [ ] Auto-refresh works (if enabled)
- [ ] Date filters update data
- [ ] Export CSV functionality works

#### Finance Dashboard
- [ ] All KPI cards load (Revenue, Orders, Profit, Inventory)
- [ ] Sales vs Orders chart displays
- [ ] Payment Mix chart displays
- [ ] Recent orders table shows data
- [ ] Pagination works
- [ ] Filters update data (date range, branch, cashier)
- [ ] Quick date ranges work (Today, MTD, YTD, etc.)
- [ ] Export CSV works
- [ ] Cashflow chart displays
- [ ] Comparative analytics show period comparison
- [ ] Alerts panel shows warnings
- [ ] "View All" alerts toggle works
- [ ] Auto-refresh works

#### Products
- [ ] Products list loads
- [ ] Search functionality works
- [ ] Category filter works
- [ ] Create new product
- [ ] Upload product image
- [ ] Edit existing product
- [ ] Delete product
- [ ] Low stock indicator shows
- [ ] Pagination works

#### Categories
- [ ] Categories list loads
- [ ] Create new category
- [ ] Upload category image
- [ ] Edit existing category
- [ ] Delete category

#### Orders
- [ ] Orders list loads
- [ ] Create new order (POS interface)
- [ ] Add items to cart
- [ ] Apply discount
- [ ] Select payment method
- [ ] Complete order
- [ ] View order details
- [ ] Cancel order
- [ ] Refund order
- [ ] Filter by status
- [ ] Filter by payment method
- [ ] Date range filter

#### Delivery
- [ ] Login as delivery user
- [ ] View assigned orders
- [ ] Start delivery (change status to "out_for_delivery")
- [ ] Mark as delivered
- [ ] View customer details
- [ ] View delivery address

#### Reports
- [ ] Sales report loads
- [ ] Financial report loads
- [ ] Date filters work
- [ ] Export reports to CSV
- [ ] Charts display correctly

#### Settings
- [ ] Profile settings load
- [ ] Update profile information
- [ ] Change password
- [ ] Security settings work
- [ ] Notification preferences save
- [ ] Storefront settings update
- [ ] Billing information saves
- [ ] Integrations configure correctly

---

## 🔧 Automated Testing Script

Create a file `test-api.sh` and run all tests:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5001/api"
TOKEN=""

echo "🧪 Starting API Tests..."

# Test 1: Login
echo -e "\n${YELLOW}Test 1: Login${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
else
  echo -e "${RED}✗ Login failed${NC}"
  exit 1
fi

# Test 2: Get Categories
echo -e "\n${YELLOW}Test 2: Get Categories${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Categories fetched${NC}"
else
  echo -e "${RED}✗ Categories failed${NC}"
fi

# Test 3: Get Products
echo -e "\n${YELLOW}Test 3: Get Products${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Products fetched${NC}"
else
  echo -e "${RED}✗ Products failed${NC}"
fi

# Test 4: Get Orders
echo -e "\n${YELLOW}Test 4: Get Orders${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Orders fetched${NC}"
else
  echo -e "${RED}✗ Orders failed${NC}"
fi

# Test 5: Get Analytics Summary
echo -e "\n${YELLOW}Test 5: Get Analytics Summary${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/summary" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "totalRevenue"; then
  echo -e "${GREEN}✓ Analytics summary fetched${NC}"
else
  echo -e "${RED}✗ Analytics summary failed${NC}"
fi

# Test 6: Get Delivery Orders (should fail if not delivery user)
echo -e "\n${YELLOW}Test 6: Get Delivery Orders${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/delivery/my-orders" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success\|Not authorized"; then
  echo -e "${GREEN}✓ Delivery endpoint accessible${NC}"
else
  echo -e "${RED}✗ Delivery endpoint failed${NC}"
fi

# Test 7: Get Branches
echo -e "\n${YELLOW}Test 7: Get Branches${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/branches" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Branches fetched${NC}"
else
  echo -e "${RED}✗ Branches failed${NC}"
fi

# Test 8: Get Expenses
echo -e "\n${YELLOW}Test 8: Get Expenses${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/expenses" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Expenses fetched${NC}"
else
  echo -e "${RED}✗ Expenses failed${NC}"
fi

echo -e "\n${GREEN}✅ All tests completed!${NC}"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📝 Notes

### Common Issues:
1. **401 Unauthorized**: Token expired or invalid. Login again.
2. **403 Forbidden**: User doesn't have permission for this action.
3. **404 Not Found**: Endpoint doesn't exist or ID is invalid.
4. **500 Internal Server Error**: Check backend logs.

### Tips:
- Replace `YOUR_TOKEN` with actual JWT token from login
- Replace `PRODUCT_ID`, `CATEGORY_ID`, etc. with actual IDs
- Use `-v` flag with curl for verbose output: `curl -v ...`
- Check backend logs: `tail -f /tmp/backend.log`
- Check frontend logs in browser console (F12)

### Environment:
- Backend: `http://localhost:5001`
- Frontend: `http://localhost:5173`
- MongoDB: Check connection in backend logs

---

**Last Updated**: November 8, 2025

