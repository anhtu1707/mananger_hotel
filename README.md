# Restaurant Management System

Hệ thống quản lý nhà hàng với Frontend React.js và Backend FastAPI.

## 🚀 Tính năng

- ✅ Quản lý thực đơn món ăn (CRUD)
- ✅ Quản lý nhân viên
- ✅ Quản lý bàn (trạng thái trống/bận)
- ✅ Quản lý kho nguyên liệu
- ✅ Quản lý đơn hàng
- ✅ Báo cáo doanh thu theo ngày/tháng
- ✅ Đăng nhập/Đăng xuất với JWT Authentication

## 🛠 Công nghệ sử dụng

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- MySQL Database
- JWT Authentication
- Uvicorn Server

### Frontend
- React.js (thuần, không dùng UI framework)
- React Router DOM
- Axios
- CSS thuần

## 📋 Yêu cầu hệ thống

- Python 3.8+
- Node.js 14+
- MySQL 5.7+

## 🔧 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd restaurant-management
```

### 2. Cài đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo database MySQL
# Đăng nhập MySQL và chạy:
CREATE DATABASE restaurant_db;

# Cập nhật thông tin database trong file .env
# DATABASE_URL=mysql+pymysql://username:password@localhost:3306/restaurant_db

# Khởi tạo database với dữ liệu mẫu
python init_db.py

# Chạy server
python main.py
```

Backend sẽ chạy tại: http://localhost:8000

### 3. Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

## 👤 Tài khoản demo

- **Admin**: username: `admin`, password: `admin123`
- **Nhân viên**: username: `staff`, password: `staff123`

## 📁 Cấu trúc dự án

```
restaurant-management/
├── backend/
│   ├── app/
│   │   ├── controllers/    # API endpoints
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── utils/         # Utility functions
│   ├── database/          # Database configuration
│   ├── main.py           # FastAPI app
│   └── requirements.txt   # Python dependencies
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   └── styles/        # CSS files
    └── package.json       # Node dependencies
```

## 🔑 API Documentation

Sau khi chạy backend, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📱 Responsive Design

Ứng dụng được thiết kế responsive, hoạt động tốt trên:
- Desktop
- Tablet
- Mobile

## 🔒 Bảo mật

- JWT Authentication
- Password hashing với bcrypt
- Role-based access control (Admin, Manager, Staff)
- CORS configuration

## 🎯 Roadmap

- [ ] Thêm chức năng đặt bàn trước
- [ ] Tích hợp thanh toán online
- [ ] Thêm dashboard analytics
- [ ] Export báo cáo PDF
- [ ] Mobile app

## 📄 License

MIT License