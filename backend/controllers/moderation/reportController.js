import { Report } from '../../models/index.js';
import Post from '../../models/Post.js';
import User from '../../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

export const createReport = async (req, res) => {
  try {
    const { targetType, target, reason, description } = req.body;
    if (!targetType || !target || !reason) return errorResponse(res, 400, 'targetType, target, and reason are required.');
    const existing = await Report.findOne({ reporter: req.user._id, target, targetType, status: 'pending' });
    if (existing) return errorResponse(res, 409, 'You already reported this content.');
    const report = await Report.create({ reporter: req.user._id, targetType, target, reason, description });
    return successResponse(res, 201, 'Report submitted. Thank you for helping keep Writavo safe.', { report });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', targetType } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    const [reports, total] = await Promise.all([
      Report.find(filter).populate('reporter', 'username displayName avatar').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Report.countDocuments(filter),
    ]);
    return paginatedResponse(res, { reports }, page, limit, total);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const reviewReport = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return errorResponse(res, 404, 'Report not found.');
    Object.assign(report, { status, resolution, reviewedBy: req.user._id, reviewedAt: new Date() });
    await report.save();
    if (status === 'resolved' && report.targetType === 'Post') await Post.findByIdAndUpdate(report.target, { isDeleted: true });
    if (status === 'resolved' && report.targetType === 'User') await User.findByIdAndUpdate(report.target, { isActive: false });
    return successResponse(res, 200, 'Report reviewed.', { report });
  } catch (err) { return errorResponse(res, 500, err.message); }
};
