import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TableForm from './TableForm';
import './Tables.css';

const Tables = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await tableService.getAll();
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTable(null);
    setShowForm(true);
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      try {
        await tableService.delete(id);
        await loadTables();
      } catch (error) {
        alert('Không thể xóa bàn này');
      }
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingTable) {
        await tableService.update(editingTable.id, data);
      } else {
        await tableService.create(data);
      }
      setShowForm(false);
      await loadTables();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu bàn');
    }
  };

  const handleStatusChange = async (table, newStatus) => {
    try {
      await tableService.updateStatus(table.id, newStatus);
      await loadTables();
    } catch (error) {
      alert('Không thể cập nhật trạng thái bàn');
    }
  };

  const handleCreateOrder = (table) => {
    navigate('/orders/new', { state: { tableId: table.id } });
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'available') return table.status === 'available';
    if (filter === 'occupied') return table.status === 'occupied';
    if (filter === 'reserved') return table.status === 'reserved';
    return table.location === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'danger';
      case 'reserved': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Đang phục vụ';
      case 'reserved': return 'Đã đặt';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tables-page">
      <div className="page-header">
        <h1>Quản lý bàn</h1>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={handleCreate}>
            ➕ Thêm bàn mới
          </button>
        )}
      </div>

      <div className="table-filters">
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
          Bàn trống
        </button>
        <button
          className={`filter-btn ${filter === 'occupied' ? 'active' : ''}`}
          onClick={() => setFilter('occupied')}
        >
          Đang phục vụ
        </button>
        <button
          className={`filter-btn ${filter === 'reserved' ? 'active' : ''}`}
          onClick={() => setFilter('reserved')}
        >
          Đã đặt
        </button>
        <button
          className={`filter-btn ${filter === 'indoor' ? 'active' : ''}`}
          onClick={() => setFilter('indoor')}
        >
          Trong nhà
        </button>
        <button
          className={`filter-btn ${filter === 'outdoor' ? 'active' : ''}`}
          onClick={() => setFilter('outdoor')}
        >
          Ngoài trời
        </button>
        <button
          className={`filter-btn ${filter === 'vip' ? 'active' : ''}`}
          onClick={() => setFilter('vip')}
        >
          VIP
        </button>
      </div>

      <div className="tables-grid">
        {filteredTables.map(table => (
          <div key={table.id} className={`table-card ${table.status}`}>
            <div className="table-card-header">
              <h3>{table.table_number}</h3>
              <span className={`badge badge-${getStatusColor(table.status)}`}>
                {getStatusText(table.status)}
              </span>
            </div>

            <div className="table-info">
              <p>
                <span className="info-label">Sức chứa:</span>
                <span className="info-value">{table.capacity} người</span>
              </p>
              <p>
                <span className="info-label">Vị trí:</span>
                <span className="info-value">
                  {table.location === 'indoor' && 'Trong nhà'}
                  {table.location === 'outdoor' && 'Ngoài trời'}
                  {table.location === 'vip' && 'VIP'}
                </span>
              </p>
            </div>

            <div className="table-actions">
              {table.status === 'available' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleCreateOrder(table)}
                >
                  📝 Tạo đơn
                </button>
              )}
              
              <div className="status-actions">
                <select
                  className="form-select form-select-sm"
                  value={table.status}
                  onChange={(e) => handleStatusChange(table, e.target.value)}
                >
                  <option value="available">Trống</option>
                  <option value="occupied">Đang phục vụ</option>
                  <option value="reserved">Đã đặt</option>
                </select>
              </div>

              {(isAdmin || isManager) && (
                <>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(table)}
                  >
                    ✏️ Sửa
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(table.id)}
                    >
                      🗑️ Xóa
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TableForm
          table={editingTable}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Tables;