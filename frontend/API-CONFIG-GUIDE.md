# 🔧 Hướng dẫn cấu hình API tự động

## 📋 Tổng quan

Hệ thống đã được cấu hình để tự động chuyển đổi API URLs giữa môi trường development và production mà không cần thay đổi code thủ công.

## 🚀 Cách sử dụng

### 1. Development (Local)
```bash
# Chạy development server
npm run dev

# Hoặc với environment variables rõ ràng
npm run dev:local
```

### 2. Production (Deploy)
```bash
# Set domain và build cho production
npm run build:prod your-domain.com

# Hoặc set domain trước, sau đó build
npm run set-prod your-domain.com
npm run build
```

## 🔧 Cấu hình

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`: URL của API backend
- `NEXT_PUBLIC_FRONTEND_URL`: URL của frontend

### Files quan trọng
- `lib/config.ts`: Cấu hình chính cho API URLs
- `lib/api.ts`: Utility functions cho API calls
- `set-production-env.js`: Script tự động set production URLs
- `update-api-calls.js`: Script cập nhật API calls

## 📝 API Usage

### Thay vì hardcode URLs:
```typescript
// ❌ Cũ - hardcode
const response = await fetch("http://27.72.246.67:9009/api/events")

// ✅ Mới - sử dụng API utility
const data = await api.getEvents()
```

### Các API functions có sẵn:
```typescript
// Events
await api.getEvents()
await api.createEvent(data)
await api.updateEvent(id, data)
await api.deleteEvent(id)

// Guests
await api.getGuests(eventId?)
await api.getGuestsCheckedIn()
await api.createGuest(data)
await api.updateGuest(id, data)
await api.deleteGuest(id)
await api.getGuestQR(id)
await api.getGuestQRImage(id)

// Check-in
await api.checkinGuest(data)
await api.checkoutGuest(data)
await api.deleteCheckin(id)
```

## 🌐 Tự động chuyển đổi URLs

### Development
- API: `http://27.72.246.67:9009`
- Frontend: `http://27.72.246.67:9009`

### Production
- API: `https://your-domain.com/api`
- Frontend: `https://your-domain.com`

## 🛠️ Troubleshooting

### 1. API calls không hoạt động
- Kiểm tra backend có chạy không
- Kiểm tra CORS settings
- Kiểm tra environment variables

### 2. Production URLs không đúng
- Chạy lại: `npm run set-prod your-domain.com`
- Kiểm tra file `.env.production`
- Kiểm tra `lib/config.ts`

### 3. Import errors
- Đảm bảo import đúng: `import { api } from "../../lib/api"`
- Kiểm tra đường dẫn relative

## 📚 Ví dụ sử dụng

### Trong component:
```typescript
import { api } from "../../lib/api"

export default function MyComponent() {
  const [events, setEvents] = useState([])
  
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents()
        setEvents(data)
      } catch (error) {
        console.error("Error loading events:", error)
      }
    }
    
    loadEvents()
  }, [])
  
  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.name}</div>
      ))}
    </div>
  )
}
```

## 🎯 Lợi ích

1. **Tự động**: Không cần thay đổi code khi deploy
2. **Nhất quán**: Tất cả API calls sử dụng cùng một pattern
3. **Dễ bảo trì**: Chỉ cần sửa ở một nơi
4. **Type-safe**: TypeScript support đầy đủ
5. **Error handling**: Xử lý lỗi thống nhất

## 🔄 Workflow

1. **Development**: Code với `npm run dev`
2. **Test**: Kiểm tra với localhost
3. **Deploy**: `npm run build:prod your-domain.com`
4. **Production**: Tự động sử dụng production URLs
