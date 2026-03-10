import { Bookmark } from '../../models/index.js';
import Post from '../../models/Post.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

export const toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return errorResponse(res, 404, 'Post not found.');
    const existing = await Bookmark.findOne({ user: req.user._id, post: post._id });
    if (existing) { await existing.deleteOne(); return successResponse(res, 200, 'Bookmark removed.', { bookmarked: false }); }
    await Bookmark.create({ user: req.user._id, post: post._id });
    return successResponse(res, 201, 'Post bookmarked.', { bookmarked: true });
  } catch (err) { return errorResponse(res, 500, err.message); }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .populate({ path: 'post', populate: { path: 'author', select: 'firstName lastName username avatar displayName' } })
        .sort({ savedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Bookmark.countDocuments({ user: req.user._id }),
    ]);
    return paginatedResponse(res, { posts: bookmarks.map(b => b.post).filter(Boolean) }, page, limit, total);
  } catch (err) { return errorResponse(res, 500, err.message); }
};
