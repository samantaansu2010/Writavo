import { Notification } from '../../models/index.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (page - 1) * limit;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'firstName lastName username avatar')
        .populate('relatedPost', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return paginatedResponse(res, { notifications, unreadCount }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return successResponse(res, 200, 'Notification marked as read.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    return successResponse(res, 200, 'All notifications marked as read.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    return successResponse(res, 200, 'Notification deleted.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
