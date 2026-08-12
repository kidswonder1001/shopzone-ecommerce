const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} = require('../controllers/productController');
const { adminProtect } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.post('/upload', adminProtect, upload.array('images', 5), uploadProductImages);
router.get('/:id', getProductById);
router.post('/', adminProtect, createProduct);
router.put('/:id', adminProtect, updateProduct);
router.delete('/:id', adminProtect, deleteProduct);

module.exports = router;
