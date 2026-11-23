const express = require('express');
const { getInventory, getHistory, adjustStock } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin', 'stock_manager'), getInventory);
router.get('/history', authorize('admin', 'stock_manager'), getHistory);
router.put('/:id', authorize('admin', 'stock_manager'), adjustStock);

module.exports = router;
