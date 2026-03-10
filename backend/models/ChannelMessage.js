import mongoose from 'mongoose';

const channelMessageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  channel:   { type: String, required: true, index: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 4000 },
  type:      { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  media:     { url: String, name: String, size: Number },
  replyTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessage' },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    count: { type: Number, default: 0 },
  }],
  isPinned:  { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  editedAt:  { type: Date },
}, { timestamps: true });

channelMessageSchema.index({ community: 1, channel: 1, createdAt: -1 });

const ChannelMessage = mongoose.model('ChannelMessage', channelMessageSchema);
export default ChannelMessage;
