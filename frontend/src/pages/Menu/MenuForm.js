import React, { useState } from 'react';

const MenuForm = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || 'main_course',
    image_url: item?.image_url || '',
    is_available: item?.is_available ?? true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{item ? 'Sửa món ăn' : 'Thêm món mới'}</h2>
          <button className="btn btn-sm" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tên món</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Giá (VNĐ)</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="1000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="appetizer">Khai vị</option>
                <option value="main_course">Món chính</option>
                <option value="dessert">Tráng miệng</option>
                <option value="beverage">Đồ uống</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL hình ảnh</label>
              <input
                type="url"
                name="image_url"
                className="form-input"
                value={formData.image_url}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                />
                <span>Còn món</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuForm;