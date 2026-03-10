import mongoose from 'mongoose';

// ===================== COMMENT =====================
const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    likeCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
export const Comment = mongoose.model('Comment', commentSchema);

// ===================== LIKE =====================
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Post', 'Comment'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  },
  { timestamps: true }
);
likeSchema.index({ user: 1, target: 1, targetType: 1 }, { unique: true });
export const Like = mongoose.model('Like', likeSchema);

// ===================== FOLLOW =====================
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });
export const Follow = mongoose.model('Follow', followSchema);

// ===================== MESSAGE =====================
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for channel msgs
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }, // null for DMs
    conversationId: { type: String }, // for DMs: sorted user ids joined
    content: { type: String, required: true, maxlength: 5000 },
    messageType: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    reactions: [
      {
        emoji: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
export const Message = mongoose.model('Message', messageSchema);

// ===================== NOTIFICATION =====================
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'mention', 'message', 'community_invite', 'system', 'newsletter'],
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    relatedComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    relatedCommunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String },
  },
  {
    timestamps: true,
    // TTL: auto-delete after 30 days
  }
);
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
export const Notification = mongoose.model('Notification', notificationSchema);
// ===================== NEWSLETTER SUBSCRIPTION =====================
const newsletterSchema = new mongoose.Schema(
  {
    subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    writer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    frequency: { type: String, enum: ['instant', 'daily', 'weekly', 'monthly'], default: 'instant' },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
newsletterSchema.index({ subscriber: 1, writer: 1 }, { unique: true });
export const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// ===================== MEDIA =====================
const mediaSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String, required: true },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'document', 'avatar', 'banner'], default: 'image' },
    usedInPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    isPublic: { type: Boolean, default: true },
    thumbnailUrl: { type: String },
  },
  { timestamps: true }
);
mediaSchema.index({ owner: 1, mediaType: 1 });
export const Media = mongoose.model('Media', mediaSchema);

// ===================== RESTACK =====================
const restackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);
restackSchema.index({ user: 1, post: 1 }, { unique: true });
export const Restack = mongoose.model('Restack', restackSchema);
// Re-export Community from its own file (avoid duplicate model registration)
export { default as Community } from './Community.js';
export { default as ChannelMessage } from './ChannelMessage.js';

// ===================== BOOKMARK =====================
const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  savedAt: { type: Date, default: Date.now },
}, { timestamps: true });
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, savedAt: -1 });
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

// ===================== REPORT =====================
const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['Post', 'Comment', 'User', 'Community'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, enum: ['spam', 'harassment', 'misinformation', 'copyright', 'explicit', 'other'], required: true },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  resolution: { type: String, maxlength: 500 },
}, { timestamps: true });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, target: 1, targetType: 1 });
export const Report = mongoose.model('Report', reportSchema);

// ===================== READING HISTORY =====================
const readingHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  readAt: { type: Date, default: Date.now },
  readTime: { type: Number, default: 0 }, // seconds spent reading
  completed: { type: Boolean, default: false },
}, { timestamps: true });
readingHistorySchema.index({ user: 1, readAt: -1 });
readingHistorySchema.index({ user: 1, post: 1 }, { unique: true });
export const ReadingHistory = mongoose.model('ReadingHistory', readingHistorySchema);

// ===================== ANALYTICS EVENT =====================
const analyticsSchema = new mongoose.Schema({
  event: { type: String, enum: ['page_view', 'post_view', 'post_like', 'post_comment', 'user_follow', 'community_join', 'search'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });
analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 day TTL
export const Analytics = mongoose.model('Analytics', analyticsSchema);
