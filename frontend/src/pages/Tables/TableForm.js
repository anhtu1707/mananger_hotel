import React, { useState } from 'react';

const TableForm = ({ table, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    table_number: table?.table_number || '',
    capacity: table?.capacity || '',
    location: table?.location || 'indoor'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: parseInt(formData.capacity)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{table ? 'Sửa thông tin bàn' : 'Thêm bàn mới'}</h2>
          <button className="btn btn-sm" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Số bàn</label>
              <input
                type="text"
                name="table_number"
                className="form-input"
                value={formData.table_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sức chứa (số người)</label>
              <input
                type="number"
                name="capacity"
                className="form-input"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="20"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vị trí</label>
              <select
                name="location"
                className="form-select"
                value={formData.location}
                onChange={handleChange}
              >
                <option value="indoor">Trong nhà</option>
                <option value="outdoor">Ngoài trời</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {table ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableForm;