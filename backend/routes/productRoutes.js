const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'stock_manager'), upload.single('image'), createProduct);
router.put('/:id', authorize('admin', 'stock_manager'), upload.single('image'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
