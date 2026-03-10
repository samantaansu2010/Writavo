import Post from '../../models/Post.js';
import User from '../../models/User.js';
import { Like, Comment, Restack, Notification, Follow } from '../../models/index.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

// POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { title, subtitle, body, tags, category, status, coverImage, scheduledAt, seo } = req.body;
    if (!title || !body) return errorResponse(res, 400, 'Title and body are required.');

    const post = await Post.create({
      title, subtitle, body, tags, category, status: status || 'draft',
      author: req.user._id, coverImage, scheduledAt, seo,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPosts: 1 } });

    // Notify followers if published
    if (post.status === 'published') {
      notifyFollowers(req.user._id, post).catch(console.error);
    }

    return successResponse(res, 201, 'Post created successfully.', { post });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const notifyFollowers = async (authorId, post) => {
  const follows = await Follow.find({ following: authorId }).limit(500);
  const notifications = follows.map(f => ({
    recipient: f.follower,
    type: 'newsletter',
    sender: authorId,
    relatedPost: post._id,
    message: `Published a new post: "${post.title}"`,
    link: `/post/${post.slug}`,
  }));
  if (notifications.length) await Notification.insertMany(notifications);
};

// GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, tag, author, status = 'published', search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (author) filter.author = author;
    if (search) filter.$text = { $search: search };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'firstName lastName username avatar displayName')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    return paginatedResponse(res, { posts }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/posts/feed
export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let posts, total;

    if (req.user) {
      // Get following list
      const follows = await Follow.find({ follower: req.user._id }).select('following');
      const followingIds = follows.map(f => f.following);
      followingIds.push(req.user._id);

      const filter = { author: { $in: followingIds }, status: 'published', isDeleted: false };
      [posts, total] = await Promise.all([
        Post.find(filter)
          .populate('author', 'firstName lastName username avatar displayName')
          .sort({ publishedAt: -1 })
          .skip(skip).limit(parseInt(limit)),
        Post.countDocuments(filter),
      ]);
    }

    // Fall back to discover if no posts
    if (!posts?.length) {
      const filter = { status: 'published', isDeleted: false };
      [posts, total] = await Promise.all([
        Post.find(filter)
          .populate('author', 'firstName lastName username avatar displayName')
          .sort({ likeCount: -1, viewCount: -1, publishedAt: -1 })
          .skip(skip).limit(parseInt(limit)),
        Post.countDocuments(filter),
      ]);
    }

    return paginatedResponse(res, { posts }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/posts/:slug
export const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, isDeleted: false })
      .populate('author', 'firstName lastName username avatar displayName bio totalFollowers totalPosts');
    if (!post) return errorResponse(res, 404, 'Post not found.');
    if (post.status !== 'published' && post.author._id.toString() !== req.user?._id?.toString()) {
      return errorResponse(res, 403, 'This post is not published yet.');
    }

    // Increment view count (non-blocking)
    Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } }).exec();

    // Get user's like status
    let isLiked = false;
    let isRestacked = false;
    if (req.user) {
      const [like, restack] = await Promise.all([
        Like.findOne({ user: req.user._id, target: post._id, targetType: 'Post' }),
        Restack.findOne({ user: req.user._id, post: post._id }),
      ]);
      isLiked = !!like;
      isRestacked = !!restack;
    }

    return successResponse(res, 200, 'Post retrieved.', { post, isLiked, isRestacked });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/posts/:id
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 404, 'Post not found.');
    if (post.author.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');

    const { title, subtitle, body, tags, category, status, coverImage, seo } = req.body;
    post.editHistory.push({ editedAt: new Date() });
    Object.assign(post, { title, subtitle, body, tags, category, status, coverImage, seo });
    await post.save();

    return successResponse(res, 200, 'Post updated.', { post });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 404, 'Post not found.');
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') return errorResponse(res, 403, 'Not authorized.');

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();
    await User.findByIdAndUpdate(post.author, { $inc: { totalPosts: -1 } });
    return successResponse(res, 200, 'Post deleted.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 404, 'Post not found.');

    const existing = await Like.findOne({ user: req.user._id, target: post._id, targetType: 'Post' });
    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: -1 } });
      return successResponse(res, 200, 'Post unliked.', { liked: false, likeCount: post.likeCount - 1 });
    }

    await Like.create({ user: req.user._id, target: post._id, targetType: 'Post' });
    await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: 1 } });

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        type: 'like',
        sender: req.user._id,
        relatedPost: post._id,
        message: `${req.user.displayName || req.user.username} liked your post "${post.title}"`,
        link: `/post/${post.slug}`,
      });
    }

    return successResponse(res, 200, 'Post liked.', { liked: true, likeCount: post.likeCount + 1 });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/posts/:id/comments
export const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { post: req.params.id, parentComment: null, isDeleted: false };

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('author', 'firstName lastName username avatar displayName')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Comment.countDocuments(filter),
    ]);

    return paginatedResponse(res, { comments }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/posts/:id/comments
export const addComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    if (!content) return errorResponse(res, 400, 'Comment content is required.');

    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 404, 'Post not found.');

    const comment = await Comment.create({
      post: post._id, author: req.user._id, content, parentComment: parentComment || null,
    });
    await comment.populate('author', 'firstName lastName username avatar displayName');

    await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });
    if (parentComment) await Comment.findByIdAndUpdate(parentComment, { $inc: { replyCount: 1 } });

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        type: 'comment',
        sender: req.user._id,
        relatedPost: post._id,
        relatedComment: comment._id,
        message: `${req.user.displayName || req.user.username} commented on "${post.title}"`,
        link: `/post/${post.slug}`,
      });
    }

    return successResponse(res, 201, 'Comment added.', { comment });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/posts/:id/restack
export const restackPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 404, 'Post not found.');

    const existing = await Restack.findOne({ user: req.user._id, post: post._id });
    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(post._id, { $inc: { restackCount: -1 } });
      return successResponse(res, 200, 'Restack removed.', { restacked: false });
    }

    await Restack.create({ user: req.user._id, post: post._id, note: req.body.note });
    await Post.findByIdAndUpdate(post._id, { $inc: { restackCount: 1 } });
    return successResponse(res, 201, 'Post restacked.', { restacked: true });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/posts/:postId/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return errorResponse(res, 404, 'Comment not found.');
    // Allow author or post author or admin
    const post = await Post.findById(req.params.id);
    const isAuthor  = comment.author.toString() === req.user._id.toString();
    const isPostOwner = post?.author.toString() === req.user._id.toString();
    const isAdmin   = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isAuthor && !isPostOwner && !isAdmin) return errorResponse(res, 403, 'Not authorized.');
    comment.isDeleted = true;
    comment.content   = '[deleted]';
    await comment.save();
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } });
    return successResponse(res, 200, 'Comment deleted.');
  } catch (error) { return errorResponse(res, 500, error.message); }
};

// PUT /api/posts/:postId/comments/:commentId
export const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return errorResponse(res, 400, 'Content required.');
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return errorResponse(res, 404, 'Comment not found.');
    if (comment.author.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');
    comment.content  = content.trim();
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'firstName lastName username avatar displayName');
    return successResponse(res, 200, 'Comment updated.', { comment });
  } catch (error) { return errorResponse(res, 500, error.message); }
};

// POST /api/posts/:postId/comments/:commentId/like
export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return errorResponse(res, 404, 'Comment not found.');
    const existing = await Like.findOne({ user: req.user._id, target: comment._id, targetType: 'Comment' });
    if (existing) {
      await existing.deleteOne();
      await Comment.findByIdAndUpdate(comment._id, { $inc: { likeCount: -1 } });
      return successResponse(res, 200, 'Like removed.', { liked: false });
    }
    await Like.create({ user: req.user._id, target: comment._id, targetType: 'Comment' });
    await Comment.findByIdAndUpdate(comment._id, { $inc: { likeCount: 1 } });
    return successResponse(res, 200, 'Comment liked.', { liked: true });
  } catch (error) { return errorResponse(res, 500, error.message); }
};
