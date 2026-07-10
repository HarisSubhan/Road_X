const ServiceCategory = require('../models/ServiceCategory');

const getAllCategories = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const categories = await ServiceCategory.findAll(includeInactive);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ServiceCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

const createCategory = async (req, res) => {
  try {
    const data = req.body;
    const categoryId = await ServiceCategory.create(data);
    const category = await ServiceCategory.findById(categoryId);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    await ServiceCategory.update(id, data);
    const category = await ServiceCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.query.action || 'soft';
    
    if (action === 'hard') {
      await ServiceCategory.delete(id);
    } else {
      await ServiceCategory.softDelete(id);
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await ServiceCategory.getStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category stats' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
};
