#!/bin/bash

echo "🔍 Settings Page Verification Script"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking backend server..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 5001${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd backend && npm run dev"
fi

# Check if frontend is running
echo ""
echo "2. Checking frontend server..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
fi

# Check MongoDB connection
echo ""
echo "3. Checking MongoDB..."
if mongosh --eval "db.version()" mongodb://localhost:27017/pos_system > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
    
    # Count users with settings
    USER_COUNT=$(mongosh --quiet --eval "db.users.countDocuments({'settings': {\$exists: true}})" mongodb://localhost:27017/pos_system)
    echo -e "${GREEN}   Found $USER_COUNT user(s) with settings data${NC}"
else
    echo -e "${RED}❌ MongoDB is NOT running${NC}"
    echo "   Start it with: sudo systemctl start mongod"
fi

# Check settings routes
echo ""
echo "4. Checking settings API routes..."
ROUTES=(
    "profile"
    "security"
    "notifications"
    "storefront"
    "billing"
    "integrations"
    "audit"
)

for route in "${ROUTES[@]}"; do
    # This will return 401 without auth, which is expected
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/settings/$route)
    if [ "$STATUS" = "401" ]; then
        echo -e "${GREEN}✅ /api/settings/$route endpoint exists${NC}"
    else
        echo -e "${RED}❌ /api/settings/$route returned $STATUS${NC}"
    fi
done

echo ""
echo "====================================="
echo "📊 Summary:"
echo ""
echo "Settings page URL: http://localhost:5173/settings"
echo ""
echo "To test:"
echo "1. Open http://localhost:5173/login"
echo "2. Login with your credentials"
echo "3. Navigate to http://localhost:5173/settings"
echo "4. You should see your real data!"
echo ""
echo "For detailed documentation, see:"
echo "  📄 SETTINGS_IMPLEMENTATION_PLAN.md"
echo ""
