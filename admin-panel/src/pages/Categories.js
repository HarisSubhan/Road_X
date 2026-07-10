import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ur: '',
    icon_emoji: '⛽',
    base_fare: 0,
    price_per_km: 0,
    estimated_time_minutes: 30,
    sort_order: 0,
    is_active: true,
    required_fields: []
  });

  const emojis = ['⛽', '🚗', '🏍️', '🔧', '🔋', '🛞', '🔑', '🚐', '🛻', '🚑', '⚙️', '🔩'];

  useEffect(() => {
    fetchCategories();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(showInactive);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      fetchCategories();
      setShowAddDialog(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_ur: category.name_ur || '',
      icon_emoji: category.icon_emoji || '⛽',
      base_fare: category.base_fare,
      price_per_km: category.price_per_km,
      estimated_time_minutes: category.estimated_time_minutes,
      sort_order: category.sort_order,
      is_active: category.is_active === 1,
      required_fields: category.required_fields || []
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesAPI.delete(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ur: '',
      icon_emoji: '⛽',
      base_fare: 0,
      price_per_km: 0,
      estimated_time_minutes: 30,
      sort_order: 0,
      is_active: true,
      required_fields: []
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Service Categories</h1>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show inactive</span>
          </label>
          <button
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{category.icon_emoji || '📂'}</span>
                <div>
                  <h3 className="font-bold text-lg">{category.name_en}</h3>
                  <p className="text-gray-600 text-sm" dir="rtl">{category.name_ur}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Base Fare: PKR {category.base_fare}</p>
              <p>Per KM: PKR {category.price_per_km}</p>
              <p>Est. Time: {category.estimated_time_minutes} min</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_emoji: emoji })}
                      className={`text-2xl p-2 rounded ${formData.icon_emoji === emoji ? 'bg-red-100 ring-2 ring-red-500' : 'bg-gray-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (English)</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (اردو)</label>
                <input
                  type="text"
                  value={formData.name_ur}
                  onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Fare (PKR)</label>
                  <input
                    type="number"
                    value={formData.base_fare}
                    onChange={(e) => setFormData({ ...formData, base_fare: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Per KM Rate (PKR)</label>
                  <input
                    type="number"
                    value={formData.price_per_km}
                    onChange={(e) => setFormData({ ...formData, price_per_km: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Est. Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_time_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_time_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddDialog(false); setEditingCategory(null); resetForm(); }}
                  className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
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

export default Categories;
