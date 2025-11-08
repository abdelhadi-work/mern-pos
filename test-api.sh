#!/bin/bash

# ============================================
# MERN POS API Testing Script
# ============================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5001/api"
TOKEN=""
PASSED=0
FAILED=0

# Print header
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                     🧪 MERN POS API TESTING SUITE                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print test result
print_result() {
  local test_name=$1
  local success=$2
  local response=$3
  
  if [ "$success" = true ]; then
    echo -e "${GREEN}✓ PASS${NC} - $test_name"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} - $test_name"
    echo -e "  ${RED}Response: $response${NC}"
    ((FAILED++))
  fi
}

# Test 1: Health Check
echo -e "\n${BLUE}═══ Test 1: Health Check ═══${NC}"
RESPONSE=$(curl -s http://localhost:5001/)
if echo "$RESPONSE" | grep -q "POS API is running"; then
  print_result "Backend server is running" true
else
  print_result "Backend server is running" false "$RESPONSE"
  echo -e "${RED}Backend is not running! Please start it first.${NC}"
  exit 1
fi

# Test 2: Login
echo -e "\n${BLUE}═══ Test 2: Authentication ═══${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  print_result "Login with admin credentials" true
  echo -e "  ${CYAN}Token: ${TOKEN:0:20}...${NC}"
else
  print_result "Login with admin credentials" false "$RESPONSE"
  echo -e "${RED}Cannot proceed without authentication!${NC}"
  exit 1
fi

# Test 3: Invalid Login
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}')

if echo "$RESPONSE" | grep -q "Invalid credentials"; then
  print_result "Login with invalid credentials (should fail)" true
else
  print_result "Login with invalid credentials (should fail)" false "$RESPONSE"
fi

# Test 4: Get Users
echo -e "\n${BLUE}═══ Test 3: User Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  USER_COUNT=$(echo "$RESPONSE" | grep -o '"username"' | wc -l)
  print_result "Get all users" true
  echo -e "  ${CYAN}Found $USER_COUNT users${NC}"
else
  print_result "Get all users" false "$RESPONSE"
fi

# Test 5: Categories
echo -e "\n${BLUE}═══ Test 4: Category Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  CATEGORY_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l)
  print_result "Get all categories" true
  echo -e "  ${CYAN}Found $CATEGORY_COUNT categories${NC}"
else
  print_result "Get all categories" false "$RESPONSE"
fi

# Test 6: Products
echo -e "\n${BLUE}═══ Test 5: Product Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  PRODUCT_COUNT=$(echo "$RESPONSE" | grep -o '"sku"' | wc -l)
  print_result "Get all products" true
  echo -e "  ${CYAN}Found $PRODUCT_COUNT products${NC}"
else
  print_result "Get all products" false "$RESPONSE"
fi

# Test 7: Low Stock Products
RESPONSE=$(curl -s -X GET "$BASE_URL/products/lowstock" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success\|products"; then
  print_result "Get low stock products" true
else
  print_result "Get low stock products" false "$RESPONSE"
fi

# Test 8: Orders
echo -e "\n${BLUE}═══ Test 6: Order Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  ORDER_COUNT=$(echo "$RESPONSE" | grep -o '"orderNumber"' | wc -l)
  print_result "Get all orders" true
  echo -e "  ${CYAN}Found $ORDER_COUNT orders${NC}"
else
  print_result "Get all orders" false "$RESPONSE"
fi

# Test 9: Today's Sales
RESPONSE=$(curl -s -X GET "$BASE_URL/orders/today" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success\|totalSales"; then
  TOTAL_SALES=$(echo "$RESPONSE" | grep -o '"totalSales":[0-9.]*' | cut -d':' -f2)
  print_result "Get today's sales" true
  echo -e "  ${CYAN}Today's sales: \$$TOTAL_SALES${NC}"
else
  print_result "Get today's sales" false "$RESPONSE"
fi

# Test 10: Delivery
echo -e "\n${BLUE}═══ Test 7: Delivery Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/delivery/my-orders" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success\|Not authorized"; then
  print_result "Delivery endpoint accessible" true
  if echo "$RESPONSE" | grep -q "Not authorized"; then
    echo -e "  ${YELLOW}Note: Admin user cannot access delivery orders (expected)${NC}"
  fi
else
  print_result "Delivery endpoint accessible" false "$RESPONSE"
fi

# Test 11: Analytics
echo -e "\n${BLUE}═══ Test 8: Analytics ═══${NC}"

# Summary
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/summary" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "totalRevenue"; then
  REVENUE=$(echo "$RESPONSE" | grep -o '"totalRevenue":[0-9.]*' | cut -d':' -f2)
  ORDERS=$(echo "$RESPONSE" | grep -o '"totalOrders":[0-9]*' | cut -d':' -f2)
  print_result "Get analytics summary" true
  echo -e "  ${CYAN}Total Revenue: \$$REVENUE, Total Orders: $ORDERS${NC}"
else
  print_result "Get analytics summary" false "$RESPONSE"
fi

# Time series
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/timeseries" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "buckets\|interval"; then
  print_result "Get time series data" true
else
  print_result "Get time series data" false "$RESPONSE"
fi

# Payment mix
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/payment-mix" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "paymentMix"; then
  print_result "Get payment mix" true
else
  print_result "Get payment mix" false "$RESPONSE"
fi

# Profit summary
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/profit/summary" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "grossProfit\|netProfit"; then
  print_result "Get profit summary" true
else
  print_result "Get profit summary" false "$RESPONSE"
fi

# Inventory metrics
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/inventory" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "currentStockValue\|inventoryTurnover"; then
  print_result "Get inventory metrics" true
else
  print_result "Get inventory metrics" false "$RESPONSE"
fi

# Cashflow
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/cashflow" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "dailyFlow\|totalInflow"; then
  print_result "Get cashflow analysis" true
else
  print_result "Get cashflow analysis" false "$RESPONSE"
fi

# Alerts
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/alerts" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "alerts"; then
  print_result "Get alerts" true
else
  print_result "Get alerts" false "$RESPONSE"
fi

# Dashboard snapshot (unified endpoint)
RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "summary\|timeseries\|profitSummary"; then
  print_result "Get dashboard snapshot (unified)" true
else
  print_result "Get dashboard snapshot (unified)" false "$RESPONSE"
fi

# Test 12: Branches
echo -e "\n${BLUE}═══ Test 9: Branch Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/branches" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  BRANCH_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l)
  print_result "Get all branches" true
  echo -e "  ${CYAN}Found $BRANCH_COUNT branches${NC}"
else
  print_result "Get all branches" false "$RESPONSE"
fi

# Test 13: Expenses
echo -e "\n${BLUE}═══ Test 10: Expense Management ═══${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/expenses" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "success"; then
  EXPENSE_COUNT=$(echo "$RESPONSE" | grep -o '"amount"' | wc -l)
  print_result "Get all expenses" true
  echo -e "  ${CYAN}Found $EXPENSE_COUNT expenses${NC}"
else
  print_result "Get all expenses" false "$RESPONSE"
fi

# Test 14: Settings
echo -e "\n${BLUE}═══ Test 11: Settings ═══${NC}"

# Profile
RESPONSE=$(curl -s -X GET "$BASE_URL/settings/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "username\|fullName"; then
  print_result "Get profile settings" true
else
  print_result "Get profile settings" false "$RESPONSE"
fi

# Storefront
RESPONSE=$(curl -s -X GET "$BASE_URL/settings/storefront" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "storeName\|currency"; then
  print_result "Get storefront settings" true
else
  print_result "Get storefront settings" false "$RESPONSE"
fi

# Security
RESPONSE=$(curl -s -X GET "$BASE_URL/settings/security" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "twoFactorEnabled\|sessions"; then
  print_result "Get security settings" true
else
  print_result "Get security settings" false "$RESPONSE"
fi

# Print summary
echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           📊 TEST SUMMARY                                     ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${BLUE}Total Tests: $TOTAL${NC}"
echo -e "${CYAN}Pass Rate: $PASS_RATE%${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed! Your API is working correctly.${NC}"
  exit 0
else
  echo -e "\n${YELLOW}⚠️  Some tests failed. Please check the errors above.${NC}"
  exit 1
fi

