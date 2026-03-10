import { getPersonalizedFeed, getTrendingPosts, getSimilarPosts } from '../../services/recommendationEngine.js';
import Post from '../../models/Post.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

export const getPersonalizedFeedHandler = async (req, res) => {
  try {
    const page       = parseInt(req.query.page)  || 1;
    const limit      = parseInt(req.query.limit) || 20;
    const excludeIds = req.query.exclude ? req.query.exclude.split(',') : [];
    const result     = await getPersonalizedFeed(req.user._id, { page, limit, excludeIds });
    return paginatedResponse(res, { posts: result.posts }, page, limit, result.total);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load feed');
  }
};

export const getTrendingFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await getTrendingPosts(limit);
    return successResponse(res, 200, 'Trending posts.', { posts });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load trending');
  }
};

export const getSimilarPostsHandler = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit) || 6;
    const posts = await getSimilarPosts(postId, limit);
    return successResponse(res, 200, 'Similar posts.', { posts });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load similar posts');
  }
};

export const getExploreFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, tag } = req.query;
    const skip   = (page - 1) * limit;
    const filter = { status: 'published', isDeleted: false };
    if (category) filter.category = category;
    if (tag)      filter.tags = tag;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'firstName lastName username avatar displayName')
        .sort({ likeCount: -1, viewCount: -1, publishedAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);
    return paginatedResponse(res, { posts }, page, limit, total);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load explore feed');
  }
};
