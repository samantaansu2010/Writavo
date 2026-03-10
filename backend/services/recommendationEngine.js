/**
 * Writavo Recommendation Engine (ESM)
 * Scores posts based on tags, social signals, engagement, and recency.
 */
import Post from '../models/Post.js';
import { Like, Follow, Restack } from '../models/index.js';
import User from '../models/User.js';

const W = {
  TAG_MATCH:          8.0,
  CATEGORY_MATCH:     5.0,
  FOLLOWING_AUTHOR:  12.0,
  NETWORK_LIKED:      6.0,
  NETWORK_RESTACKED:  8.0,
  HIGH_ENGAGEMENT:    4.0,
  RECENCY_BOOST:      3.0,
  ALREADY_SEEN:     -20.0,
  SAME_AUTHOR_REPEAT: -5.0,
};

function recencyScore(publishedAt) {
  const ageHours = (Date.now() - new Date(publishedAt)) / 3_600_000;
  if (ageHours < 6)   return 1.0;
  if (ageHours < 24)  return 0.85;
  if (ageHours < 72)  return 0.65;
  if (ageHours < 168) return 0.45;
  if (ageHours < 720) return 0.25;
  return 0.10;
}

function engagementRate(post) {
  const views = Math.max(post.viewCount || 1, 1);
  return Math.min((post.likeCount || 0) / views, 1);
}

export async function getPersonalizedFeed(userId, { page = 1, limit = 20, excludeIds = [] } = {}) {
  try {
    const user = await User.findById(userId).lean();
    if (!user) return { posts: [], total: 0, hasNext: false };

    const follows = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = follows.map(f => f.following.toString());

    const userInterests = user.interests || [];
    const userType      = user.userType || '';

    const [networkLikes, networkRestacks] = await Promise.all([
      Like.find({ user: { $in: followingIds }, targetType: 'Post' }).select('target').lean(),
      Restack.find({ user: { $in: followingIds } }).select('post').lean(),
    ]);

    const networkLikedPostIds  = new Set(networkLikes.map(l => l.target.toString()));
    const networkRestakedPostIds = new Set(networkRestacks.map(r => r.post.toString()));

    const candidateCount = limit * 5;
    const candidates = await Post.find({
      status: 'published',
      isDeleted: false,
      _id: { $nin: excludeIds },
    })
      .populate('author', 'firstName lastName username avatar displayName')
      .sort({ publishedAt: -1 })
      .limit(candidateCount)
      .lean();

    const authorCounts = {};
    const scored = candidates.map(post => {
      let score = 0;
      const postId  = post._id.toString();
      const authorId = post.author?._id?.toString();

      if (followingIds.includes(authorId)) score += W.FOLLOWING_AUTHOR;
      if (networkLikedPostIds.has(postId))    score += W.NETWORK_LIKED;
      if (networkRestakedPostIds.has(postId)) score += W.NETWORK_RESTACKED;

      if (post.tags?.some(t => userInterests.includes(t))) score += W.TAG_MATCH;
      if (userInterests.includes(post.category)) score += W.CATEGORY_MATCH;

      const eng = engagementRate(post);
      if (eng > 0.05) score += W.HIGH_ENGAGEMENT * eng;

      const recency = recencyScore(post.publishedAt);
      if (recency > 0.8) score += W.RECENCY_BOOST;

      score *= recency;

      authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
      if (authorCounts[authorId] > 2) score += W.SAME_AUTHOR_REPEAT;

      return { post, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const start = (page - 1) * limit;
    const paginated = scored.slice(start, start + limit).map(s => s.post);

    return {
      posts:   paginated,
      total:   scored.length,
      hasNext: start + limit < scored.length,
    };
  } catch (err) {
    console.error('[RecommendationEngine]', err);
    const posts = await Post.find({ status: 'published', isDeleted: false })
      .populate('author', 'firstName lastName username avatar displayName')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    return { posts, total: posts.length, hasNext: false };
  }
}

export async function getTrendingPosts(limit = 10) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  return Post.find({ status: 'published', isDeleted: false, publishedAt: { $gte: since } })
    .populate('author', 'firstName lastName username avatar displayName')
    .sort({ likeCount: -1, viewCount: -1, commentCount: -1 })
    .limit(limit)
    .lean();
}

export async function getSimilarPosts(postId, limit = 6) {
  const post = await Post.findById(postId).lean();
  if (!post) return [];
  return Post.find({
    _id: { $ne: postId },
    status: 'published',
    isDeleted: false,
    $or: [
      { tags: { $in: post.tags } },
      { category: post.category },
    ],
  })
    .populate('author', 'firstName lastName username avatar displayName')
    .sort({ likeCount: -1, publishedAt: -1 })
    .limit(limit)
    .lean();
}
