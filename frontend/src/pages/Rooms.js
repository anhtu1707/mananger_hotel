import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'single',
    price_per_night: '',
    capacity: '',
    amenities: '',
    description: '',
    status: 'available'
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, formData);
        toast.success('Room updated successfully');
      } else {
        await roomsAPI.create(formData);
        toast.success('Room created successfully');
      }
      setShowModal(false);
      setEditingRoom(null);
      resetForm();
      loadRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night,
      capacity: room.capacity,
      amenities: room.amenities || '',
      description: room.description || '',
      status: room.status
    });
    setShowModal(true);
  };

  const handleDelete = async (room) => {
    if (window.confirm(`Are you sure you want to delete room ${room.room_number}?`)) {
      try {
        await roomsAPI.delete(room.id);
        toast.success('Room deleted successfully');
        loadRooms();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'single',
      price_per_night: '',
      capacity: '',
      amenities: '',
      description: '',
      status: 'available'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      available: 'badge badge-success',
      occupied: 'badge badge-warning',
      maintenance: 'badge badge-danger',
      cleaning: 'badge badge-info',
    };
    return statusClasses[status] || 'badge badge-secondary';
  };

  if (loading) {
    return <LoadingSpinner message="Loading rooms..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600">Manage your hotel rooms</p>
        </div>
        <button
          onClick={() => {
            setEditingRoom(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Room
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Room {room.room_number}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{room.room_type}</p>
              </div>
              <span className={getStatusBadge(room.status)}>
                {room.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price per night:</span>
                <span className="text-sm font-medium">${room.price_per_night}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Capacity:</span>
                <span className="text-sm font-medium">{room.capacity} guests</span>
              </div>
              {room.amenities && (
                <div>
                  <span className="text-sm text-gray-600">Amenities:</span>
                  <p className="text-sm text-gray-900 mt-1">{room.amenities}</p>
                </div>
              )}
              {room.description && (
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{room.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(room)}
                className="btn btn-outline flex-1"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(room)}
                className="btn btn-danger flex-1"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No rooms found. Add your first room to get started.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.room_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={formData.room_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_type: e.target.value }))}
                  required
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                  <option value="deluxe">Deluxe</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price per Night ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="WiFi, AC, TV, etc."
                  value={formData.amenities}
                  onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Room description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingRoom ? 'Update' : 'Create'} Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoom(null);
                    resetForm();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;