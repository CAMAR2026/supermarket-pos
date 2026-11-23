const express = require('express');
const { getSales, getSale, createSale, refundSale } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin', 'cashier'), getSales);
router.post('/', authorize('admin', 'cashier'), createSale);
router.get('/:id', authorize('admin', 'cashier'), getSale);
router.put('/:id/refund', authorize('admin'), refundSale);

module.exports = router;
