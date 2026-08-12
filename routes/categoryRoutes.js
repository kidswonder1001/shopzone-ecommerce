const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', getCategories);
router.post('/', adminProtect, createCategory);
router.put('/:id', adminProtect, updateCategory);
router.delete('/:id', adminProtect, deleteCategory);

module.exports = router;
