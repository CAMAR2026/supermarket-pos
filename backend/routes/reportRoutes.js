const express = require('express');
const { dashboard, salesReport, stockReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/dashboard', dashboard);
router.get('/sales', authorize('admin'), salesReport);
router.get('/stock', authorize('admin', 'stock_manager'), stockReport);

module.exports = router;
