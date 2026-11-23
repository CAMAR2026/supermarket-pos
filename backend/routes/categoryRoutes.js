const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('admin', 'stock_manager'), createCategory);
router.put('/:id', authorize('admin', 'stock_manager'), updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;
