import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    username: {
      type: String, required: true, unique: true, trim: true, lowercase: true,
      minlength: 3, maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String, required: true, unique: true, lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, sparse: true },
    displayName: { type: String, trim: true, maxlength: 100 },
    bio: { type: String, maxlength: 500 },
    avatar: { type: String, default: null },
    banner: { type: String, default: null },
    website: { type: String, default: null },
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true;
          const age = (new Date() - new Date(v)) / (365.25 * 24 * 60 * 60 * 1000);
          return age >= 10 && age <= 150;
        },
        message: 'User must be at least 10 years old',
      },
    },
    userType: {
      type: String,
      enum: ['Student', 'Writer / Blogger', 'Photographer', 'Designer / Artist', 'Developer', 'Just exploring'],
      default: 'Just exploring',
    },
    interests: { type: [String], default: [] },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetTokenExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    totalPosts: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    totalFollowing: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
      postsVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
      allowMessagesFrom: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
      allowCommentsOn: { type: String, enum: ['everyone', 'followers', 'nobody'], default: 'everyone' },
      showFollowersCount: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
    },
    notifications: {
      inApp: {
        newFollower: { type: Boolean, default: true },
        newComment: { type: Boolean, default: true },
        newLike: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
      },
      email: {
        newFollower: { type: Boolean, default: false },
        digestDaily: { type: Boolean, default: false },
        digestWeekly: { type: Boolean, default: true },
        newsAndUpdates: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: true },
      },
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
    },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    onlineStatus: { type: String, enum: ['online', 'offline', 'dnd'], default: 'offline' },
    banReason: { type: String },
    bannedAt: { type: Date },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes (email & username already indexed via unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ 'privacy.profileVisibility': 1 });

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcryptjs.compare(enteredPassword, this.password);
};

// Instance method: check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Set displayName default
userSchema.pre('save', function (next) {
  if (!this.displayName) this.displayName = `${this.firstName} ${this.lastName}`;
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
