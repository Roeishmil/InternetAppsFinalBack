import postModel, { Ipost } from "../models/postsModel";
import { Request, Response } from "express";
import BaseController from "./baseController";
import fileRouter from "../routes/fileRoute";

// Remove the buffer Blob import and use the web Blob interface
interface FileRequest extends Request {
    file?: Express.Multer.File;
}

class PostsController extends BaseController<Ipost> {
    constructor() {
        super(postModel);
    }

    async create(req: FileRequest, res: Response) {
        try {
            console.log('reached post creation');
            const userId = req.body.owner;
            
            const postData = {
                ...req.body,
                owner: userId
            };
            
            const post = new postModel(postData);
            const savedPost = await post.save();
            const port = process.env.PORT;

            if (req.file) {
                console.log('reached file creation');
                
                // Create array buffer from file buffer
                const arrayBuffer = req.file.buffer.buffer.slice(
                    req.file.buffer.byteOffset,
                    req.file.buffer.byteOffset + req.file.buffer.byteLength
                );
                
                // Create blob using the web Blob interface
                const fileBlob = new Blob([arrayBuffer], { type: req.file.mimetype });
                const formData = new FormData();
                formData.append('file', fileBlob, req.file.originalname);
    
                const response = await fetch(`${process.env.BASE_URL}:${port}/storage?imgId=${savedPost._id}`, {
                    method: 'POST',
                    body: formData
                });
    
                if (!response.ok) {
                    throw new Error('Failed to upload file');
                }
    
                const fileData = await response.json();
                
                if (fileData.url) {
                    const finalUrl = `${process.env.BASE_URL}:${port}/storage/${savedPost._id}/${fileData.url.split('/').pop()}`;
                    console.log("post file url", finalUrl);
                    savedPost.imgUrl = finalUrl;
                    await savedPost.save();
                }
                
                const updatedPost = await postModel.findById(savedPost._id);
            }
    
            res.status(201).json({ status: 201, message: 'Post created successfully' });
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ 
                error: "Error creating post", 
                details: (error as Error).message 
            });
        }
    }

    // Apply the same Blob fix to updateItem
    async updateItem(req: FileRequest, res: Response) {
        if (req.file) {
            console.log('postbody', req.body);
            const port = process.env.PORT;
            const postId = req.body.id;
            
            // Create array buffer from file buffer
            const arrayBuffer = req.file.buffer.buffer.slice(
                req.file.buffer.byteOffset,
                req.file.buffer.byteOffset + req.file.buffer.byteLength
            );
            
            // Create blob using the web Blob interface
            const fileBlob = new Blob([arrayBuffer], { type: req.file.mimetype });
            const formData = new FormData();
            formData.append('file', fileBlob, req.file.originalname);

            const response = await fetch(`${process.env.BASE_URL}:${port}/storage?imgId=${postId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const fileData = await response.json();            
            const finalUrl = `${process.env.BASE_URL}:${port}/storage/${postId}/${fileData.url.split('/').pop()}`;
            req.body.imgUrl = finalUrl;
        }
        super.updateItem(req, res);
    }

    // Other methods remain unchanged
    async getAll(req: Request, res: Response) {
        try {
            const posts = await postModel.find();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    }
  
    async getById(req: Request, res: Response) {
        super.getById(req, res);
    }

    async deleteItem(req: Request, res: Response) {
        super.deleteItem(req, res);
    }

    async deleteAllItems(req: Request, res: Response) {
        try {
            const posts = await postModel.find();
            const deletePromises = posts.map(post => postModel.findByIdAndDelete(post._id));
            await Promise.all(deletePromises);
            console.log('All items removed');
            res.status(200).json({ message: 'All items removed' });
        } catch (error) {
            console.error('Error deleting items:', error);
            res.status(500).json({ message: 'Deletion error', error });
        }
    }
}

export default new PostsController();