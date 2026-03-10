import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300 },
    slug: { type: String, unique: true, lowercase: true },
    body: { type: String, required: true },
    excerpt: { type: String, maxlength: 500 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverImage: {
      url: { type: String },
      alt: { type: String, default: '' },
      caption: { type: String, default: '' },
    },
    tags: { type: [String], default: [], index: true },
    category: {
      type: String,
      enum: ['Writing', 'Technology', 'Science', 'Art', 'Music', 'Travel', 'Food', 'Health', 'Business', 'Education', 'Entertainment', 'Sports', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    restackCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 1 }, // in minutes
    seo: {
      metaTitle: { type: String, maxlength: 60 },
      metaDescription: { type: String, maxlength: 160 },
    },
    editHistory: [
      {
        editedAt: { type: Date, default: Date.now },
        reason: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    featuredUntil: { type: Date },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes (slug unique, tags has index: true in schema)
postSchema.index({ author: 1, status: 1 });
postSchema.index({ category: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text', body: 'text', tags: 'text' });

// Auto-generate slug from title
postSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.slug = `${baseSlug}-${Date.now()}`;
  }
  // Calculate reading time
  if (this.isModified('body')) {
    const wordsPerMinute = 200;
    const wordCount = this.body.split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
  // Set publishedAt when publishing
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual: short excerpt
postSchema.virtual('shortExcerpt').get(function () {
  if (this.excerpt) return this.excerpt;
  return this.body.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
});

const Post = mongoose.model('Post', postSchema);
export default Post;
