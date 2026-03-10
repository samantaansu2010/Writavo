import express from 'express';
import * as postController from '../controllers/content/postController.js';
import * as bookmarkController from '../controllers/content/bookmarkController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Feed & listing
router.get('/feed',                       optionalAuth,  postController.getFeed);
router.get('/',                           optionalAuth,  postController.getPosts);

// Post CRUD
router.post('/',                          protect,       postController.createPost);
router.get('/:slug',                      optionalAuth,  postController.getPost);
router.put('/:id',                        protect,       postController.updatePost);
router.delete('/:id',                     protect,       postController.deletePost);

// Post actions
router.post('/:id/like',                  protect,       postController.likePost);
router.post('/:id/restack',               protect,       postController.restackPost);
router.post('/:id/bookmark',              protect,       bookmarkController.toggleBookmark);

// Comments
router.get('/:id/comments',                             postController.getComments);
router.post('/:id/comments',              protect,       postController.addComment);
router.put('/:id/comments/:commentId',    protect,       postController.editComment);
router.delete('/:id/comments/:commentId', protect,       postController.deleteComment);
router.post('/:id/comments/:commentId/like', protect,   postController.likeComment);

export default router;
