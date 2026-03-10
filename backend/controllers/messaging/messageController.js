import { Message } from '../../models/index.js';
import User from '../../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/apiResponse.js';

const getConversationId = (userId1, userId2) =>
  [userId1.toString(), userId2.toString()].sort().join('_');

// GET /api/messages/conversations
export const getConversations = async (req, res) => {
  try {
    // Get latest message per conversation involving this user
    const convos = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
          channel: null,
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$recipient', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 50 },
    ]);

    // Populate the other user in each conversation
    const populated = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.lastMessage.conversationId
          .split('_')
          .find((id) => id !== req.user._id.toString());
        const otherUser = await User.findById(otherId).select('firstName lastName username avatar onlineStatus');
        return { ...c, otherUser };
      })
    );

    return successResponse(res, 200, 'Conversations retrieved.', { conversations: populated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/messages/:userId
export const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const conversationId = getConversationId(req.user._id, req.params.userId);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId, isDeleted: false })
        .populate('sender', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)),
      Message.countDocuments({ conversationId, isDeleted: false }),
    ]);

    // Mark messages as read
    Message.updateMany(
      { conversationId, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    ).exec();

    return paginatedResponse(res, { messages: messages.reverse() }, page, limit, total);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/messages/:userId
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return errorResponse(res, 400, 'Message content is required.');

    const recipient = await User.findById(req.params.userId);
    if (!recipient) return errorResponse(res, 404, 'Recipient not found.');

    const conversationId = getConversationId(req.user._id, recipient._id);
    const message = await Message.create({
      sender: req.user._id,
      recipient: recipient._id,
      conversationId,
      content: content.trim(),
    });
    await message.populate('sender', 'firstName lastName username avatar');

    return successResponse(res, 201, 'Message sent.', { message });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/messages/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return errorResponse(res, 404, 'Message not found.');
    if (message.sender.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
    return successResponse(res, 200, 'Message deleted.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
