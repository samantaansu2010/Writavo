import User from '../../models/User.js';
import Post from '../../models/Post.js';
import { Community } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

// GET /api/search?q=...&type=all|users|posts|communities
export const globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 2) return errorResponse(res, 400, 'Search query must be at least 2 characters.');

    const skip = (page - 1) * limit;
    const regex = new RegExp(q, 'i');
    const results = {};

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [{ title: regex }, { tags: regex }],
        status: 'published', isDeleted: false,
      })
        .populate('author', 'firstName lastName username avatar')
        .select('title slug excerpt coverImage likeCount commentCount readingTime publishedAt author tags')
        .sort({ likeCount: -1, publishedAt: -1 })
        .limit(parseInt(limit));
    }

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [{ username: regex }, { displayName: regex }, { firstName: regex }, { lastName: regex }],
        isActive: true,
      })
        .select('firstName lastName username avatar displayName bio totalFollowers')
        .limit(parseInt(limit));
    }

    if (type === 'all' || type === 'communities') {
      results.communities = await Community.find({
        $or: [{ name: regex }, { description: regex }, { tags: regex }],
        visibility: 'public',
      })
        .select('name slug description icon memberCount tags')
        .limit(parseInt(limit));
    }

    return successResponse(res, 200, 'Search results.', { query: q, ...results });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/search/trending
export const getTrending = async (req, res) => {
  try {
    const [trendingPosts, trendingTags] = await Promise.all([
      Post.find({ status: 'published', isDeleted: false })
        .populate('author', 'firstName lastName username avatar')
        .select('title slug excerpt coverImage likeCount viewCount readingTime publishedAt author tags')
        .sort({ likeCount: -1, viewCount: -1 })
        .limit(10),
      Post.aggregate([
        { $match: { status: 'published', isDeleted: false } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return successResponse(res, 200, 'Trending content.', { posts: trendingPosts, tags: trendingTags });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
