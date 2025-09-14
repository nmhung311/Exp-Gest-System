#!/bin/bash

echo "🔄 Cập nhật tất cả API endpoints..."

# Cập nhật trang guests
echo "📝 Cập nhật trang guests..."
sed -i 's|http://localhost:5001/api/guests|API_ENDPOINTS.GUESTS.LIST|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/events|API_ENDPOINTS.EVENTS.LIST|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/checked-in|API_ENDPOINTS.GUESTS.CHECKED_IN|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/bulk-checkin|API_ENDPOINTS.GUESTS.BULK_CHECKIN|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/bulk-checkout|API_ENDPOINTS.GUESTS.BULK_CHECKOUT|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/bulk-delete|API_ENDPOINTS.GUESTS.BULK_DELETE|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/import|API_ENDPOINTS.GUESTS.IMPORT|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx
sed -i 's|http://localhost:5001/api/guests/import-csv|API_ENDPOINTS.GUESTS.IMPORT_CSV|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/guests/page.tsx

# Cập nhật trang events
echo "📝 Cập nhật trang events..."
sed -i 's|http://localhost:5001/api/events|API_ENDPOINTS.EVENTS.LIST|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/events/page.tsx

# Cập nhật trang checkin
echo "📝 Cập nhật trang checkin..."
sed -i 's|http://localhost:5001/api/checkin|API_ENDPOINTS.CHECKIN.CHECKIN|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/checkin/page.tsx
sed -i 's|http://localhost:5001/api/events|API_ENDPOINTS.EVENTS.LIST|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/checkin/page.tsx
sed -i 's|http://localhost:5001/api/guests|API_ENDPOINTS.GUESTS.LIST|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/checkin/page.tsx

# Cập nhật trang stats
echo "📝 Cập nhật trang stats..."
sed -i 's|http://localhost:5001/api/guests|API_ENDPOINTS.STATS.GUESTS|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/stats/page.tsx
sed -i 's|http://localhost:5001/api/guests/checked-in|API_ENDPOINTS.STATS.CHECKED_IN|g' /home/hung/Exp-Gest-System/frontend/app/(admin)/dashboard/stats/page.tsx

# Cập nhật ScanPanel
echo "📝 Cập nhật ScanPanel..."
sed -i 's|http://localhost:5001/api/checkin|API_ENDPOINTS.CHECKIN.CHECKIN|g' /home/hung/Exp-Gest-System/frontend/app/components/ScanPanel.tsx

echo "✅ Hoàn tất cập nhật API endpoints!"
