# Restaurant Management System

Hệ thống quản lý nhà hàng đầy đủ với FastAPI backend và React frontend, bao gồm quản lý thực đơn, đơn hàng, nhân viên, bàn, kho và báo cáo doanh thu.

## 🚀 Tính năng

- 📋 **Quản lý thực đơn**: Thêm, sửa, xóa món ăn với danh mục và trạng thái
- 🧍 **Quản lý nhân viên**: Quản lý thông tin cá nhân, vị trí và trạng thái hoạt động
- 🪑 **Quản lý bàn**: Theo dõi trạng thái bàn (trống/bận/đặt trước)
- 📦 **Quản lý kho**: Theo dõi tồn kho, cảnh báo hết hàng, quản lý nhà cung cấp
- 🛒 **Quản lý đơn hàng**: Tạo đơn hàng, theo dõi trạng thái, tính toán hóa đơn
- 📊 **Báo cáo doanh thu**: Báo cáo theo ngày/tháng, thống kê top món bán chạy
- 👥 **Phân quyền**: Admin và nhân viên với các quyền khác nhau
- 🔐 **Xác thực JWT**: Bảo mật với JSON Web Token

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI**: Framework Python hiện đại cho API
- **SQLAlchemy**: ORM cho Python
- **MySQL**: Cơ sở dữ liệu
- **JWT**: Xác thực và phân quyền
- **Pydantic**: Validation dữ liệu
- **Alembic**: Migration cơ sở dữ liệu

### Frontend
- **React.js**: Thư viện JavaScript cho UI
- **React Router**: Routing
- **Axios**: HTTP client
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Icons

## 📋 Yêu cầu hệ thống

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- npm hoặc yarn

## 🔧 Cài đặt và chạy

### 1. Thiết lập cơ sở dữ liệu MySQL

```sql
CREATE DATABASE restaurant_db;
CREATE USER 'restaurant_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON restaurant_db.* TO 'restaurant_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

```bash
cd restaurant-management/backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình database trong .env
cp .env.example .env
# Chỉnh sửa .env với thông tin database của bạn

# Khởi tạo database và dữ liệu mẫu
python -m app.init_db

# Chạy server
uvicorn app.main:app --reload --port 8000
```

Backend sẽ chạy tại: http://localhost:8000

### 3. Frontend Setup

```bash
cd restaurant-management/frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

## 🔑 Tài khoản mặc định

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator

## 📁 Cấu trúc dự án

```
restaurant-management/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT authentication
│   │   ├── controllers/    # Business logic
│   │   ├── database/       # Database config
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── init_db.py      # Database initialization
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── contexts/       # React contexts
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   └── App.js
    ├── package.json
    └── tailwind.config.js
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user hiện tại
- `GET /api/auth/users` - Danh sách users (admin)

### Menu Management
- `GET /api/menu/items` - Danh sách món ăn
- `POST /api/menu/items` - Tạo món ăn mới
- `PUT /api/menu/items/{id}` - Cập nhật món ăn
- `DELETE /api/menu/items/{id}` - Xóa món ăn

### Employee Management
- `GET /api/employees` - Danh sách nhân viên
- `POST /api/employees` - Thêm nhân viên mới
- `PUT /api/employees/{id}` - Cập nhật nhân viên
- `DELETE /api/employees/{id}` - Xóa nhân viên

### Table Management
- `GET /api/tables` - Danh sách bàn
- `POST /api/tables` - Thêm bàn mới
- `PATCH /api/tables/{id}/status` - Cập nhật trạng thái bàn

### Order Management
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PATCH /api/orders/{id}/status` - Cập nhật trạng thái đơn hàng

### Inventory Management
- `GET /api/inventory` - Danh sách kho
- `POST /api/inventory` - Thêm sản phẩm vào kho
- `PATCH /api/inventory/{id}/restock` - Nhập kho

### Reports
- `GET /api/reports/dashboard` - Dashboard overview
- `POST /api/reports/daily` - Báo cáo ngày
- `POST /api/reports/monthly` - Báo cáo tháng

## 🎯 Tính năng chính

### Dashboard
- Tổng quan doanh thu hôm nay
- Số đơn hàng và trạng thái bàn
- Cảnh báo tồn kho thấp
- Đơn hàng gần đây

### Quản lý Menu
- Phân loại món ăn (khai vị, món chính, tráng miệng, đồ uống)
- Quản lý giá cả và tình trạng có sẵn
- Upload hình ảnh món ăn
- Thời gian chuẩn bị

### Quản lý Đơn hàng
- Tạo đơn hàng cho bàn
- Theo dõi trạng thái (pending, confirmed, preparing, ready, served, paid)
- Tính toán thuế và giảm giá
- In hóa đơn

### Quản lý Kho
- Theo dõi tồn kho theo thời gian thực
- Cảnh báo khi hết hàng
- Quản lý nhà cung cấp
- Lịch sử nhập/xuất kho

### Báo cáo
- Doanh thu theo ngày/tháng
- Top món bán chạy
- Biểu đồ doanh thu
- Xuất báo cáo PDF/Excel

## 🔐 Bảo mật

- JWT token authentication
- Password hashing với bcrypt
- CORS configuration
- Input validation với Pydantic
- SQL injection protection với SQLAlchemy ORM

## 🚧 Phát triển

### Thêm tính năng mới

1. **Backend**: Tạo model → controller → route
2. **Frontend**: Tạo service → page component → add to router

### Database Migration

```bash
# Tạo migration mới
alembic revision --autogenerate -m "description"

# Chạy migration
alembic upgrade head
```

### Testing

```bash
# Backend testing
pytest

# Frontend testing
npm test
```

## 📚 Documentation

- Backend API docs: http://localhost:8000/docs (Swagger UI)
- Redoc: http://localhost:8000/redoc

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Project Link: [https://github.com/yourusername/restaurant-management](https://github.com/yourusername/restaurant-management)

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)