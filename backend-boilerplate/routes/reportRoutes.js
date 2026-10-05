const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} = require('../controllers/reportController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(getReports)
  .post(optionalAuth, createReport);

router.route('/:id')
  .get(getReportById)
  .delete(deleteReport);

router.patch('/:id/status', updateReportStatus);

module.exports = router;
