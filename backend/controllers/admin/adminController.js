import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Community from '../../models/Community.js';
import { Report } from '../../models/index.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '', role, isActive } = req.query;
    const filter = {};
    if (q) filter.$or = [{ username: new RegExp(q,'i') }, { email: new RegExp(q,'i') }, { displayName: new RegExp(q,'i') }];
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    return paginatedResponse(res, { users }, page, limit, total);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const banUser = async (req, res) => {
  try {
    const { reason = 'Violated community guidelines' } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found.');
    if (user.role === 'admin') return errorResponse(res, 403, 'Cannot ban an admin.');
    await User.findByIdAndUpdate(req.params.id, { isActive: false, banReason: reason, bannedAt: new Date(), bannedBy: req.user._id });
    return successResponse(res, 200, `User @${user.username} banned.`);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true, $unset: { banReason: 1, bannedAt: 1, bannedBy: 1 } }, { new: true }).select('-password');
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, `User @${user.username} unbanned.`, { user });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user','moderator','admin'].includes(role)) return errorResponse(res, 400, 'Invalid role.');
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return errorResponse(res, 404, 'User not found.');
    return successResponse(res, 200, `Role updated to ${role}.`, { user });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const adminDeletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id }, { new: true });
    if (!post) return errorResponse(res, 404, 'Post not found.');
    return successResponse(res, 200, 'Post removed.');
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, q } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find(filter).populate('author','username displayName avatar').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);
    return paginatedResponse(res, { posts }, page, limit, total);
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const getStats = async (req, res) => {
  try {
    const last30 = new Date(Date.now() - 30*24*60*60*1000);
    const last7  = new Date(Date.now() -  7*24*60*60*1000);
    const [totalUsers, newUsersMonth, newUsersWeek, bannedUsers, totalPosts, newPostsMonth, draftPosts, totalViews, totalLikes, pendingReports, topPosts, totalCommunities] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: last30 } }),
      User.countDocuments({ createdAt: { $gte: last7 } }),
      User.countDocuments({ isActive: false }),
      Post.countDocuments({ isDeleted: false, status: 'published' }),
      Post.countDocuments({ isDeleted: false, createdAt: { $gte: last30 } }),
      Post.countDocuments({ isDeleted: false, status: 'draft' }),
      Post.aggregate([{ $group: { _id: null, t: { $sum: '$viewCount' } } }]),
      Post.aggregate([{ $group: { _id: null, t: { $sum: '$likeCount' } } }]),
      Report.countDocuments({ status: 'pending' }),
      Post.find({ isDeleted: false, status: 'published' }).populate('author','username displayName').sort({ viewCount: -1 }).limit(10).select('title slug viewCount likeCount commentCount readingTime publishedAt').lean(),
      Community.countDocuments({ isActive: true }),
    ]);
    return successResponse(res, 200, 'Stats.', {
      users: { total: totalUsers, last30Days: newUsersMonth, last7Days: newUsersWeek, banned: bannedUsers },
      posts: { total: totalPosts, last30Days: newPostsMonth, drafts: draftPosts },
      engagement: { totalViews: totalViews[0]?.t||0, totalLikes: totalLikes[0]?.t||0 },
      moderation: { pendingReports },
      communities: { total: totalCommunities },
      topPosts,
    });
  } catch (err) { return errorResponse(res, 500, err.message); }
};
