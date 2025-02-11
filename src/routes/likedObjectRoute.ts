// likesRouter.ts
import express from 'express';
import { LikesController } from '../controllers/likedObjectController';
import { auth } from 'google-auth-library';
import { authMiddleware } from '../controllers/authController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Like:
 *       type: object
 *       required:
 *         - userId
 *         - objectId
 *         - objType
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user who liked
 *         objectId:
 *           type: string
 *           description: The ID of the liked object (post/comment)
 *         objType:
 *           type: string
 *           enum: [post, comment]
 *           description: The type of object being liked
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the like was created
 */

/**
 * @swagger
 * /likes:
 *   post:
 *     summary: Add a new like
 *     tags: [Likes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - objectId
 *               - objType
 *             properties:
 *               userId:
 *                 type: string
 *               objectId:
 *                 type: string
 *               objType:
 *                 type: string
 *                 enum: [post, comment]
 *     responses:
 *       201:
 *         description: Like created successfully
 *       400:
 *         description: Invalid input or like already exists
 */
router.post('/', async (req, res, next) => {
  try {
      await LikesController.addLike(req, res);
  } catch (error) {
      next(error);
  }
});

/**
 * @swagger
 * /likes:
 *   delete:
 *     summary: Remove a like
 *     tags: [Likes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - objectId
 *               - objType
 *             properties:
 *               userId:
 *                 type: string
 *               objectId:
 *                 type: string
 *               objType:
 *                 type: string
 *                 enum: [post, comment]
 *     responses:
 *       200:
 *         description: Like removed successfully
 *       404:
 *         description: Like not found
 */
router.delete('/', async (req, res, next) => {
    try {
        await LikesController.removeLike(req, res);
    } catch (error) {
        next(error);
    }
  });


/**
 * @swagger
 * /likes/check:
 *   get:
 *     summary: Check if user has liked an object
 *     tags: [Likes]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: objType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *     responses:
 *       200:
 *         description: Returns whether user has liked the object
 */
router.get('/check', LikesController.checkLike);

/**
 * @swagger
 * /likes/{objectId}/{objType}:
 *   get:
 *     summary: Get all likes for a specific object
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: objType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *     responses:
 *       200:
 *         description: Returns array of likes
 */
router.get('/:objectId/:objType', LikesController.getLikesByObject);

/**
 * @swagger
 * /likes/{objectId}/{objType}/count:
 *   get:
 *     summary: Get like count for an object
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: objType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *     responses:
 *       200:
 *         description: Returns the like count
 */
router.get('/:objectId/:objType/count', LikesController.getLikeCount);

export default router;