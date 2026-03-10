import Community from '../../models/Community.js';
import ChannelMessage from '../../models/ChannelMessage.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/communities
export const getCommunities = async (req, res) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search   = req.query.q;

    const query = { isPublic: true, isActive: true };
    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };

    const [communities, total] = await Promise.all([
      Community.find(query)
        .populate('owner', 'username displayName avatar')
        .select('name slug description shortDesc avatar banner color category memberCount postCount isVerified tags createdAt')
        .sort({ memberCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Community.countDocuments(query),
    ]);

    let enriched = communities;
    if (req.user) {
      const userId = req.user._id.toString();
      enriched = communities.map(c => ({
        ...c,
        isMember: c.members?.some(m => m.user?.toString() === userId) || false,
      }));
    }

    return paginatedResponse(res, { communities: enriched }, page, limit, total);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /api/communities/me
export const getMyCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      'members.user': req.user._id,
      isActive: true,
    }).populate('owner', 'username displayName avatar')
      .select('name slug avatar color category memberCount postCount')
      .lean();
    return successResponse(res, 200, 'My communities.', { communities });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /api/communities/:slug
export const getCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug, isActive: true })
      .populate('owner', 'username displayName avatar')
      .populate('admins', 'username displayName avatar')
      .lean();
    if (!community) return errorResponse(res, 404, 'Community not found.');

    let isMember = false;
    let myRole   = null;
    if (req.user) {
      const m = community.members?.find(m => m.user?.toString() === req.user._id.toString());
      isMember = !!m;
      myRole   = m?.role || null;
    }
    return successResponse(res, 200, 'Community retrieved.', { community, isMember, myRole });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /api/communities
export const createCommunity = async (req, res) => {
  try {
    const { name, description, shortDesc, category, tags, color, isPublic } = req.body;
    if (!name) return errorResponse(res, 400, 'Community name is required.');

    const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') + '-' + Date.now();

    const community = await Community.create({
      name, slug, description, shortDesc, category, tags, color,
      isPublic: isPublic !== false,
      owner: req.user._id,
      admins: [req.user._id],
      members: [{ user: req.user._id, role: 'admin' }],
      memberCount: 1,
      channels: [
        { name: 'general', slug: 'general', type: 'text', description: 'General discussion' },
        { name: 'announcements', slug: 'announcements', type: 'announcements', description: 'Community announcements' },
      ],
    });

    return successResponse(res, 201, 'Community created.', { community });
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 409, 'Community name already taken.');
    return errorResponse(res, 500, err.message);
  }
};

// PUT /api/communities/:slug
export const updateCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return errorResponse(res, 404, 'Community not found.');
    if (community.owner.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');

    const { name, description, shortDesc, category, tags, color, rules, isPublic } = req.body;
    Object.assign(community, { name, description, shortDesc, category, tags, color, rules, isPublic });
    await community.save();
    return successResponse(res, 200, 'Community updated.', { community });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// DELETE /api/communities/:slug
export const deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return errorResponse(res, 404, 'Community not found.');
    if (community.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return errorResponse(res, 403, 'Not authorized.');
    community.isActive = false;
    await community.save();
    return successResponse(res, 200, 'Community deleted.');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /api/communities/:slug/join
export const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug, isActive: true });
    if (!community) return errorResponse(res, 404, 'Community not found.');

    const alreadyMember = community.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) {
      community.members = community.members.filter(m => m.user.toString() !== req.user._id.toString());
      community.memberCount = Math.max(0, community.memberCount - 1);
      await community.save();
      return successResponse(res, 200, 'Left community.', { isMember: false });
    }

    community.members.push({ user: req.user._id, role: 'member' });
    community.memberCount += 1;
    await community.save();
    return successResponse(res, 200, 'Joined community.', { isMember: true });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /api/communities/:slug/members
export const getMembers = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
      .populate('members.user', 'username displayName avatar bio totalPosts')
      .lean();
    if (!community) return errorResponse(res, 404, 'Community not found.');
    return successResponse(res, 200, 'Members retrieved.', { members: community.members });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /api/communities/:slug/channels
export const getChannels = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug }).lean();
    if (!community) return errorResponse(res, 404, 'Community not found.');
    return successResponse(res, 200, 'Channels retrieved.', { channels: community.channels || [] });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /api/communities/:slug/channels
export const createChannel = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return errorResponse(res, 404, 'Community not found.');
    if (community.owner.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    community.channels.push({ name, slug, description, type: type || 'text', createdBy: req.user._id });
    await community.save();
    return successResponse(res, 201, 'Channel created.', { channel: community.channels[community.channels.length - 1] });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /api/communities/:slug/channels/:channelSlug/messages
export const getChannelMessages = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return errorResponse(res, 404, 'Community not found.');
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChannelMessage.find({ community: community._id, channel: req.params.channelSlug, isDeleted: false })
        .populate('sender', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit))
        .lean(),
      ChannelMessage.countDocuments({ community: community._id, channel: req.params.channelSlug, isDeleted: false }),
    ]);

    return paginatedResponse(res, { messages: messages.reverse() }, page, limit, total);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /api/communities/:slug/channels/:channelSlug/messages
export const sendChannelMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return errorResponse(res, 400, 'Message content required.');

    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return errorResponse(res, 404, 'Community not found.');

    const isMember = community.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return errorResponse(res, 403, 'You must be a member to send messages.');

    const message = await ChannelMessage.create({
      community: community._id,
      channel: req.params.channelSlug,
      sender: req.user._id,
      content: content.trim(),
    });
    await message.populate('sender', 'username displayName avatar');

    // Update channel's lastMessage + messageCount
    await Community.updateOne(
      { _id: community._id, 'channels.slug': req.params.channelSlug },
      { $set: { 'channels.$.lastMessage': message._id }, $inc: { 'channels.$.messageCount': 1 } }
    );

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) io.to(`community_${community._id}_${req.params.channelSlug}`).emit('channel_message', { message });

    return successResponse(res, 201, 'Message sent.', { message });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
