# Exp-Gest-System

Hệ thống quản lý sự kiện và khách mời với giao diện web hiện đại.

## 🚀 Tính năng chính

- **Quản lý sự kiện**: Tạo, chỉnh sửa, xóa sự kiện
- **Quản lý khách mời**: Import/export danh sách khách, QR code check-in
- **Dashboard**: Thống kê và báo cáo real-time
- **Authentication**: Đăng nhập/đăng ký an toàn
- **Responsive Design**: Tương thích mobile và desktop

## 🏗️ Kiến trúc hệ thống

### Backend (Python Flask)
- **Framework**: Flask + SQLAlchemy
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens
- **API**: RESTful endpoints

### Frontend (Next.js)
- **Framework**: Next.js 15 + React 18
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **UI Components**: Custom components với dark theme

### Deployment
- **Containerization**: Docker + Docker Compose
- **Production**: Multi-stage builds
- **Environment**: Development và Production configs

## 📁 Cấu trúc dự án

```
Exp-Gest-System/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main application
│   ├── models.py           # Database models
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
├── frontend/               # Next.js frontend
│   ├── src/                # Source code
│   ├── app/                # Next.js app directory
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container
├── deployment/             # Deployment configs
│   └── docker-compose.yml  # Docker Compose
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js 18+ (cho development)
- Python 3.11+ (cho development)

### Chạy với Docker (Khuyến nghị)

```bash
# Clone repository
git clone <repository-url>
cd Exp-Gest-System

# Chạy hệ thống
cd deployment
docker-compose up -d --build

# Kiểm tra status
docker-compose ps
```

### Chạy development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5008
- **Health Check**: http://localhost:5008/api/health

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Thông tin user

### Events
- `GET /api/events` - Danh sách sự kiện
- `POST /api/events` - Tạo sự kiện mới
- `PUT /api/events/:id` - Cập nhật sự kiện
- `DELETE /api/events/:id` - Xóa sự kiện

### Guests
- `GET /api/guests` - Danh sách khách mời
- `POST /api/guests` - Thêm khách mời
- `PUT /api/guests/:id` - Cập nhật khách mời
- `DELETE /api/guests/:id` - Xóa khách mời
- `POST /api/guests/import` - Import từ CSV
- `GET /api/guests/:id/qr` - QR code khách mời

### Check-in
- `GET /api/checkin` - Danh sách check-in
- `POST /api/checkin` - Check-in khách mời
- `GET /api/guests/checked-in` - Khách đã check-in

## 🔧 Cấu hình

### Environment Variables

#### Backend
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///exp_guest.db
```

#### Frontend
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5008
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Database
- **Development**: SQLite (tự động tạo)
- **Production**: PostgreSQL (cần cấu hình)

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Development

### Code Style
- **Python**: PEP 8, Black formatter
- **JavaScript/TypeScript**: ESLint, Prettier
- **CSS**: Tailwind CSS

### Git Workflow
- **Main branch**: `main`
- **Feature branches**: `feature/feature-name`
- **Hotfix branches**: `hotfix/issue-name`

## 🚀 Deployment

### Production với Docker
```bash
cd deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Production
- Cập nhật environment variables
- Cấu hình database production
- Setup SSL certificates
- Configure reverse proxy

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🆘 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem thư mục `docs/`
- **Email**: support@example.com

---

**Lưu ý**: Hệ thống đã được tối ưu hóa và dọn dẹp các file không cần thiết để đảm bảo hiệu suất và bảo mật tối đa.
