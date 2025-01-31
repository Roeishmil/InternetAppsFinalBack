// likesController.ts
import { Request, Response } from 'express';
import  likedObjectModel from '../models/likedObjectModel';  

export const LikesController = {
    // Add a like
    addLike: async (req: Request, res: Response) => {
        try {
            const { userId, objectId, objType } = req.body;

            // Validate object type
            const validTypes = ['post', 'comment'];
            if (!validTypes.includes(objType)) {
                return res.status(400).json({ 
                    error: `Invalid object type. Must be one of: ${validTypes.join(', ')}` 
                });
            }

            // Check if like already exists
            const existingLike = await likedObjectModel.findOne({ userId, objectId, objType });
            if (existingLike) {
                return res.status(400).json({ error: 'like already exists' });
            }

            // Create new like
            const newLike = await likedObjectModel.create({
                userId,
                objectId,
                objType,
            });

            res.status(201).json(newLike);
        } catch (error) {
            console.error('Error in addLike:', error);
            res.status(500).json({ error: 'Failed to add like' });
        }
    },

    // Remove a like
    removeLike: async (req: Request, res: Response) => {
        try {
            const { userId, objectId, objType } = req.body;

            const result = await likedObjectModel.deleteOne({ userId, objectId, objType });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'like not found' });
            }

            res.status(200).json({ message: 'like removed successfully' });
        } catch (error) {
            console.error('Error in removeLike:', error);
            res.status(500).json({ error: 'Failed to remove like' });
        }
    },

    // Check if user has liked an object
    checkLike: async (req: Request, res: Response) => {
        try {
            const { userId, objectId, objType } = req.query;

            const like = await likedObjectModel.findOne({ 
                userId, 
                objectId, 
                objType 
            });

            res.status(200).json({ hasLiked: !!like });
        } catch (error) {
            console.error('Error in checkLike:', error);
            res.status(500).json({ error: 'Failed to check like status' });
        }
    },

    // Get all likes for a specific object
    getLikesByObject: async (req: Request, res: Response) => {
        try {
            const { objectId, objType } = req.params;

            const likes = await likedObjectModel.find({ 
                objectId, 
                objType 
            }).populate('userId', 'username'); // Assuming you want user details

            res.status(200).json(likes);
        } catch (error) {
            console.error('Error in getLikesByObject:', error);
            res.status(500).json({ error: 'Failed to get likes' });
        }
    },

    // Get like count for an object
    getLikeCount: async (req: Request, res: Response) => {
        try {
            const { objectId, objType } = req.params;

            const count = await likedObjectModel.countDocuments({ objectId, objType });

            res.status(200).json({ count });
        } catch (error) {
            console.error('Error in getLikeCount:', error);
            res.status(500).json({ error: 'Failed to get like count' });
        }
    }
};