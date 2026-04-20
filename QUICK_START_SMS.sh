#!/bin/bash
# Quick start guide for FinBit SMS Import Testing

echo "=================================================="
echo "FinBit SMS Import - Quick Start"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Start Backend Server${NC}"
echo "cd backend && python manage.py runserver 0.0.0.0:8000"
echo "Expected: Running on http://0.0.0.0:8000"
echo ""

echo -e "${BLUE}Step 2: Start Frontend Dev Client${NC}"
echo "cd frontend && npx expo start --dev-client"
echo "Expected: Expo dev server running"
echo ""

echo -e "${BLUE}Step 3: Install on Android Device${NC}"
echo "First time only:"
echo "  cd frontend"
echo "  npm.cmd run android"
echo ""
echo "Then open dev client, scan QR code from expo"
echo ""

echo -e "${BLUE}Step 4: Test SMS Scanning${NC}"
echo "1) Login with test credentials"
echo "2) Tap 'Import SMS' on dashboard OR navigate to SMS screen"
echo "3) Grant READ_SMS permission when prompted"
echo "4) Tap 'Scan SMS Inbox' button"
echo "5) Review parsed SMS cards"
echo "6) Tap 'Import' on any SMS"
echo "7) Edit transaction details in modal"
echo "8) Confirm import"
echo ""

echo -e "${GREEN}✓ SMS Import Feature Complete!${NC}"
echo ""
echo "📂 Files Created:"
echo "  - frontend/services/smsParser.ts"
echo "  - frontend/services/smsService.ts"
echo "  - frontend/types/react-native-get-sms-android.d.ts"
echo ""
echo "📝 Files Modified:"
echo "  - frontend/app/sms-listener.tsx (complete redesign)"
echo "  - frontend/app/_layout.tsx (router fix)"
echo "  - frontend/components/dashboard/HomeDashboard.tsx (quick action added)"
echo "  - frontend/components/PieChartCard.tsx (color refresh)"
echo "  - backend/transactions/models.py (added transaction_date)"
echo "  - backend/transactions/serializers.py (added SMS create serializer)"
echo "  - backend/transactions/views.py (added SMS metadata endpoint)"
echo "  - backend/transactions/urls.py (registered SMS endpoint)"
echo "  - backend/transactions/admin.py (updated display)"
echo "  - backend/transactions/services.py (uses transaction_date)"
echo ""
echo "🔧 Database Migrations:"
echo "  - transactions.0003_transaction_date_and_sms_metadata.py ✅ APPLIED"
echo ""

echo -e "${YELLOW}For detailed testing guide:${NC}"
echo "  See: SMS_IMPLEMENTATION_GUIDE.md"
echo ""
