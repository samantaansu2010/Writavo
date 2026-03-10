import User from '../../models/User.js';
import Post from '../../models/Post.js';
import { Follow, Notification } from '../../models/index.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/users/:username
export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) return errorResponse(res, 404, 'User not found.');

    let isFollowing = false;
    if (req.user) {
      isFollowing = !!(await Follow.findOne({ follower: req.user._id, following: user._id }));
    }

    return successResponse(res, 200, 'Profile retrieved.', { user, isFollowing });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/users/:username/posts
export const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return errorResponse(res, 404, 'User not found.');

    const filter = { author: targetUser._id, isDeleted: false };
    const isOwner = req.user?._id.toString() === targetUser._id.toString();
    if (!isOwner) filter.status = 'published';
    else if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'firstName lastName username avatar displayName')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    return paginatedResponse(res, { posts }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, displayName, bio, website, country, state, userType, interests } = req.body;
    const allowedFields = { firstName, lastName, displayName, bio, website, country, state, userType, interests };
    Object.keys(allowedFields).forEach(k => allowedFields[k] === undefined && delete allowedFields[k]);

    const user = await User.findByIdAndUpdate(req.user._id, allowedFields, { new: true, runValidators: true });
    return successResponse(res, 200, 'Profile updated.', { user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/users/settings
export const updateSettings = async (req, res) => {
  try {
    const { privacy, notifications, preferences } = req.body;
    const updates = {};
    if (privacy) updates.privacy = { ...req.user.privacy.toObject(), ...privacy };
    if (notifications) updates.notifications = { ...req.user.notifications.toObject(), ...notifications };
    if (preferences) updates.preferences = { ...req.user.preferences.toObject(), ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return successResponse(res, 200, 'Settings updated.', { user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Resolve id or username to user
const resolveUser = async (idOrUsername) => {
  if (/^[a-fA-F0-9]{24}$/.test(idOrUsername)) return User.findById(idOrUsername);
  return User.findOne({ username: idOrUsername });
};

// POST /api/users/:id/follow (id can be userId or username)
export const followUser = async (req, res) => {
  try {
    const target = await resolveUser(req.params.id);
    if (!target) return errorResponse(res, 404, 'User not found.');
    const targetId = target._id.toString();
    if (targetId === req.user._id.toString()) return errorResponse(res, 400, 'Cannot follow yourself.');

    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (existing) {
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalFollowing: -1 } });
      await User.findByIdAndUpdate(targetId, { $inc: { totalFollowers: -1 } });
      return successResponse(res, 200, 'Unfollowed.', { following: false });
    }

    await Follow.create({ follower: req.user._id, following: targetId });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalFollowing: 1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { totalFollowers: 1 } });

    await Notification.create({
      recipient: targetId,
      type: 'follow',
      sender: req.user._id,
      message: `${req.user.displayName || req.user.username} started following you`,
      link: `/profile/${req.user.username}`,
    });

    return successResponse(res, 200, 'Following.', { following: true });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/users/:id/followers (id can be userId or username)
export const getFollowers = async (req, res) => {
  try {
    const target = await resolveUser(req.params.id);
    if (!target) return errorResponse(res, 404, 'User not found.');
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ following: target._id })
        .populate('follower', 'firstName lastName username avatar displayName bio')
        .skip(skip).limit(parseInt(limit)),
      Follow.countDocuments({ following: target._id }),
    ]);
    return paginatedResponse(res, { followers: follows.map(f => f.follower) }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/users/:id/following (id can be userId or username)
export const getFollowing = async (req, res) => {
  try {
    const target = await resolveUser(req.params.id);
    if (!target) return errorResponse(res, 404, 'User not found.');
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      Follow.find({ follower: target._id })
        .populate('following', 'firstName lastName username avatar displayName bio')
        .skip(skip).limit(parseInt(limit)),
      Follow.countDocuments({ follower: target._id }),
    ]);
    return paginatedResponse(res, { following: follows.map(f => f.following) }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/users/search
export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return errorResponse(res, 400, 'Search query is required.');
    const skip = (page - 1) * limit;

    const regex = new RegExp(q, 'i');
    const filter = {
      $or: [{ username: regex }, { displayName: regex }, { firstName: regex }, { lastName: regex }],
      isActive: true,
    };

    const [users, total] = await Promise.all([
      User.find(filter).select('firstName lastName username avatar displayName bio totalFollowers').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(res, { users }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
