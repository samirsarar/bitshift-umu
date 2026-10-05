const Report = require('../models/Report');

// @desc    Create a new incident report
// @route   POST /api/reports
// @access  Public / Optional Auth
const createReport = async (req, res, next) => {
  try {
    const { title, description, type, severity, location, coords, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!type) {
      return res.status(400).json({ success: false, message: 'Disaster type is required' });
    }

    const reportData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      type,
      severity: severity || 'medium',
      location: location || '',
      coords: Array.isArray(coords) && coords.length === 2 ? coords : [85.3096, 23.3441],
      status: status || 'active',
      timestamp: new Date(),
    };

    if (req.user) {
      reportData.user = req.user._id;
      reportData.reportedBy = req.user.name || 'Registered User';
    }

    const report = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all incident reports (with optional filters)
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res, next) => {
  try {
    const { type, severity, status, search } = req.query;
    const filter = {};

    if (type && type !== 'all') {
      filter.type = type;
    }
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Public
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PATCH /api/reports/:id/status
// @access  Public / Auth
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'investigating', 'resolved', 'dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Public / Auth
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
};
