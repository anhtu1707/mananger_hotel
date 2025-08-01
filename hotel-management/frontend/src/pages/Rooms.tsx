import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';
import { Room, RoomType, RoomFormData } from '../types';
import { useAuth } from '../context/AuthContext';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    floor: '',
    room_type: ''
  });

  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadRooms();
    loadRoomTypes();
  }, [filters]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await roomsAPI.getRooms(params);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const response = await roomsAPI.getRoomTypes();
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Failed to load room types:', error);
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const handleFormSubmit = async (formData: RoomFormData) => {
    try {
      if (editingRoom) {
        await roomsAPI.updateRoom(editingRoom.id, formData);
      } else {
        await roomsAPI.createRoom(formData);
      }
      await loadRooms();
      handleCloseForm();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (window.confirm(`Are you sure you want to delete room ${room.room_number}?`)) {
      try {
        await roomsAPI.deleteRoom(room.id);
        await loadRooms();
      } catch (error) {
        console.error('Failed to delete room:', error);
      }
    }
  };

  const handleStatusChange = async (room: Room, newStatus: string) => {
    try {
      await roomsAPI.updateRoom(room.id, { status: newStatus as any });
      await loadRooms();
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'status-available';
      case 'occupied': return 'status-occupied';
      case 'maintenance': return 'status-maintenance';
      case 'cleaning': return 'status-cleaning';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="rooms-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h2>Room Management</h2>
          <p>Manage hotel rooms and their availability</p>
        </div>
        <div className="header-right">
          {canEdit && (
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Add New Room
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
          </select>

          <select
            value={filters.floor}
            onChange={(e) => setFilters({...filters, floor: e.target.value})}
          >
            <option value="">All Floors</option>
            {[1,2,3,4,5].map(floor => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>

          <select
            value={filters.room_type}
            onChange={(e) => setFilters({...filters, room_type: e.target.value})}
          >
            <option value="">All Room Types</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className={`room-card ${getStatusColor(room.status)}`}>
            <div className="room-header">
              <div className="room-number">{room.room_number}</div>
              <div className={`room-status ${getStatusColor(room.status)}`}>
                {room.status}
              </div>
            </div>

            <div className="room-details">
              <div className="room-type">{room.room_type_name}</div>
              <div className="room-floor">Floor {room.floor}</div>
              <div className="room-price">${room.base_price}/night</div>
              <div className="room-occupancy">Max: {room.max_occupancy} guests</div>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div className="room-amenities">
                {room.amenities.slice(0, 3).map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
                {room.amenities.length > 3 && (
                  <span className="amenity-tag">+{room.amenities.length - 3} more</span>
                )}
              </div>
            )}

            <div className="room-actions">
              {canEdit && (
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room, e.target.value)}
                  className="status-select"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              )}

              {canEdit && (
                <div className="action-buttons">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditRoom(room)}
                  >
                    Edit
                  </button>
                  {user?.role === 'admin' && (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteRoom(room)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="empty-state">
          <p>No rooms found</p>
        </div>
      )}

      {/* Room Form Modal */}
      {showForm && (
        <RoomForm
          room={editingRoom}
          roomTypes={roomTypes}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

// Room Form Component
interface RoomFormProps {
  room: Room | null;
  roomTypes: RoomType[];
  onSubmit: (data: RoomFormData) => void;
  onClose: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ room, roomTypes, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<RoomFormData>({
    room_number: room?.room_number || '',
    room_type_id: room?.room_type_id || roomTypes[0]?.id || 1,
    floor: room?.floor || 1,
    notes: room?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{room ? 'Edit Room' : 'Add New Room'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Room Type</label>
            <select
              value={formData.room_type_id}
              onChange={(e) => setFormData({...formData, room_type_id: parseInt(e.target.value)})}
              required
            >
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Floor</label>
            <select
              value={formData.floor}
              onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
              required
            >
              {[1,2,3,4,5].map(floor => (
                <option key={floor} value={floor}>Floor {floor}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {room ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rooms;