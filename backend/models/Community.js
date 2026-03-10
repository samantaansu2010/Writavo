import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 80 },
  slug:         { type: String, required: true, trim: true, lowercase: true },
  description:  { type: String, maxlength: 300, default: '' },
  type:         { type: String, enum: ['text', 'announcements', 'resources'], default: 'text' },
  isPrivate:    { type: Boolean, default: false },
  position:     { type: Number, default: 0 },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessage' },
  messageCount: { type: Number, default: 0 },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const communitySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 3, maxlength: 80, unique: true },
  slug:        { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, maxlength: 1000, default: '' },
  shortDesc:   { type: String, maxlength: 160, default: '' },
  avatar:      { type: String, default: '' },
  banner:      { type: String, default: '' },
  color:       { type: String, default: '#c8622a' },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:     { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  memberCount: { type: Number, default: 1 },
  postCount:   { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['Writing','Technology','Science','Art','Music','Travel','Food','Health','Business','Education','Entertainment','Sports','Other'],
    default: 'Other',
  },
  tags:       { type: [String], default: [] },
  rules:      [{ title: String, description: String }],
  channels:   [channelSchema],
  isPublic:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

communitySchema.index({ name: 'text', description: 'text', tags: 'text' });
// slug already indexed via unique: true
communitySchema.index({ memberCount: -1 });

const Community = mongoose.model('Community', communitySchema);
export default Community;
