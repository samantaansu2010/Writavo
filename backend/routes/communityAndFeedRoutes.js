import express from 'express';
import * as communityController from '../controllers/community/communityController.js';
import * as feedController from '../controllers/feed/feedController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

// ─── COMMUNITY ROUTES ────────────────────────────────────────────────────────
export const communityRouter = express.Router();

communityRouter.get('/',               optionalAuth, communityController.getCommunities);
communityRouter.get('/me',             protect,      communityController.getMyCommunities);
communityRouter.get('/:slug',          optionalAuth, communityController.getCommunity);
communityRouter.post('/',              protect,      communityController.createCommunity);
communityRouter.put('/:slug',          protect,      communityController.updateCommunity);
communityRouter.delete('/:slug',       protect,      communityController.deleteCommunity);
communityRouter.post('/:slug/join',    protect,      communityController.joinCommunity);
communityRouter.get('/:slug/members',  optionalAuth, communityController.getMembers);
communityRouter.get('/:slug/channels', optionalAuth, communityController.getChannels);
communityRouter.post('/:slug/channels',protect,      communityController.createChannel);
communityRouter.get('/:slug/channels/:channelSlug/messages',  optionalAuth, communityController.getChannelMessages);
communityRouter.post('/:slug/channels/:channelSlug/messages', protect,      communityController.sendChannelMessage);

// ─── FEED ROUTES ─────────────────────────────────────────────────────────────
export const feedRouter = express.Router();

feedRouter.get('/',                protect,      feedController.getPersonalizedFeedHandler);
feedRouter.get('/trending',        optionalAuth, feedController.getTrendingFeed);
feedRouter.get('/explore',         optionalAuth, feedController.getExploreFeed);
feedRouter.get('/similar/:postId', optionalAuth, feedController.getSimilarPostsHandler);
