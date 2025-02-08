import express from "express";
const router = express.Router();
import commentsController from"../controllers/commentsController";
import { authMiddleware } from "../controllers/authController";


/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - postId
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the comment.
 *         content:
 *           type: string
 *           description: The content of the comment.
 *         postId:
 *           type: string
 *           description: The ID of the post this comment belongs to.
 *         author:
 *           type: string
 *           description: The ID of the user who wrote the comment.
 *       example:
 *         _id: "63f12a3b4c7d53e1a1234567"
 *         content: "This is a great post!"
 *         postId: "63f12a3b4c7d53e1a7654321"
 *         author: "userId123"
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     description: Retrieve a list of all comments.
 *     tags:
 *       - Comments
 *     responses:
 *       200:
 *         description: A list of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error.
 */
router.get("/", commentsController.getAll.bind(commentsController));

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     description: Retrieve a single comment by its ID.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to retrieve.
 *     responses:
 *       200:
 *         description: A single comment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Server error.
 */

//router.get("/:id", commentsController.getById.bind(commentsController));


router.get("/:id",commentsController.getAllByPostId.bind(commentsController));

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     description: Add a new comment to a post.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - postId
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment.
 *               postId:
 *                 type: string
 *                 description: The ID of the post the comment belongs to.
 *             example:
 *               content: "This is an amazing post!"
 *               postId: "63f12a3b4c7d53e1a7654321"
 *     responses:
 *       201:
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */

router.post("/" ,commentsController.create.bind(commentsController));



/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Remove a comment by its ID.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *       404:
 *         description: Comment not found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */

router.delete("/:id", authMiddleware,commentsController.deleteItem.bind(commentsController));


/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Update a comment's content by its ID.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The updated content of the comment.
 *             example:
 *               content: "Updated comment content."
 *     responses:
 *       200:
 *         description: Comment updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */

router.put("/:id", authMiddleware,commentsController.updateItem.bind(commentsController));

export default router;