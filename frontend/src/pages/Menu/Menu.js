import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MenuForm from './MenuForm';
import './Menu.css';

const Menu = () => {
  const { isAdmin, isManager } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const data = await menuService.getAll();
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      try {
        await menuService.delete(id);
        await loadMenuItems();
      } catch (error) {
        alert('Không thể xóa món ăn này');
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingItem) {
        await menuService.update(editingItem.id, data);
      } else {
        await menuService.create(data);
      }
      setShowForm(false);
      await loadMenuItems();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu món ăn');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await menuService.update(item.id, { is_available: !item.is_available });
      await loadMenuItems();
    } catch (error) {
      alert('Không thể cập nhật trạng thái món ăn');
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'available') return item.is_available;
    if (filter === 'unavailable') return !item.is_available;
    return item.category === filter;
  });

  const categories = {
    appetizer: 'Khai vị',
    main_course: 'Món chính',
    dessert: 'Tráng miệng',
    beverage: 'Đồ uống'
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="page-header">
        <h1>Quản lý thực đơn</h1>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={handleCreate}>
            ➕ Thêm món mới
          </button>
        )}
      </div>

      <div className="menu-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
        <button
          className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
          onClick={() => setFilter('available')}
        >
          Còn món
        </button>
        <button
          className={`filter-btn ${filter === 'unavailable' ? 'active' : ''}`}
          onClick={() => setFilter('unavailable')}
        >
          Hết món
        </button>
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-card">
            <div className="menu-card-header">
              <h3>{item.name}</h3>
              <span className={`badge ${item.is_available ? 'badge-success' : 'badge-danger'}`}>
                {item.is_available ? 'Còn món' : 'Hết món'}
              </span>
            </div>
            
            <p className="menu-description">{item.description}</p>
            
            <div className="menu-info">
              <span className="menu-price">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(item.price)}
              </span>
              <span className="menu-category">
                {categories[item.category] || item.category}
              </span>
            </div>

            {(isAdmin || isManager) && (
              <div className="menu-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleToggleAvailability(item)}
                >
                  {item.is_available ? '❌ Hết món' : '✅ Còn món'}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleEdit(item)}
                >
                  ✏️ Sửa
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <MenuForm
          item={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Menu;