import { Analytics } from '../../models/index.js';
import Post from '../../models/Post.js';
import User from '../../models/User.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const VALID_EVENTS = ['page_view', 'post_view', 'post_like', 'post_comment', 'user_follow', 'community_join', 'search'];

export const trackEvent = async (req, res) => {
  try {
    const { event, target, targetType, meta } = req.body;
    if (!event || !VALID_EVENTS.includes(event)) {
      return errorResponse(res, 400, `event must be one of: ${VALID_EVENTS.join(', ')}`);
    }
    await Analytics.create({ event, target, targetType, meta, user: req.user?._id, ip: req.ip, userAgent: req.headers['user-agent'] });
    return successResponse(res, 201, 'Event tracked.');
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const getAdminStats = async (req, res) => {
  try {
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last7  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    const [totalUsers, newUsersMonth, newUsersWeek, totalPosts, newPostsMonth, totalViews, totalLikes, topPosts] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: last30 } }),
      User.countDocuments({ createdAt: { $gte: last7 } }),
      Post.countDocuments({ isDeleted: false, status: 'published' }),
      Post.countDocuments({ isDeleted: false, status: 'published', publishedAt: { $gte: last30 } }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$likeCount' } } }]),
      Post.find({ isDeleted: false, status: 'published' }).populate('author', 'username displayName').sort({ viewCount: -1 }).limit(10).select('title slug viewCount likeCount commentCount readingTime').lean(),
    ]);
    return successResponse(res, 200, 'Stats retrieved.', {
      users: { total: totalUsers, last30Days: newUsersMonth, last7Days: newUsersWeek },
      posts: { total: totalPosts, last30Days: newPostsMonth },
      engagement: { totalViews: totalViews[0]?.total || 0, totalLikes: totalLikes[0]?.total || 0 },
      topPosts,
    });
  } catch (err) { return errorResponse(res, 500, err.message); }
};
