import postModel, { Ipost } from "../models/postsModel";
import { Request, Response } from "express";
import BaseController from "./baseController";
import fileRouter from "../routes/fileRoute"
import { Blob } from 'buffer'; // Import Blob from the 'buffer' module if necessary

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
            
            // Create the post first to get its ID
            const postData = {
                ...req.body,
                owner: userId
            };
            
            const post = new postModel(postData);
            const savedPost = await post.save();
            console.log('file',req.file);
            console.log('img',postData.imgUrl);
            const image = req.file || postData.imgUrl;
            const port = process.env.PORT;

            // If there's a file, upload it using the file route
            if (req.file) {
                console.log('reached file creation');
                
                // Create form data for file upload
                const formData = new FormData();
                const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
                formData.append('file', fileBlob, req.file.originalname);
    
                // Make request to your file upload endpoint
                const response = await fetch(`http://localhost:${port}/storage?imgId=${savedPost._id}`, {
                    method: 'POST',
                    body: formData
                });
    
                if (!response.ok) {
                    throw new Error('Failed to upload file');
                }
    
                const fileData = await response.json();
                
                // Update post with file URL
                if (fileData.url) {
                const finalUrl = `http://localhost:${port}/storage/${savedPost._id}`+'/'+fileData.url.split('/').pop();
                console.log("post file url" , finalUrl);
                savedPost.imgUrl = finalUrl;
                await savedPost.save();
                }
                // Return the complete updated post
            const updatedPost = await postModel.findById(savedPost._id);
            }
    
            res.status(201).json({status: 201,  message:'Post created successfully'});
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ 
                error: "Error creating post", 
                details: error.message 
            });
        }
    }

    
    async getAll(req: Request, res: Response) {
      try {
          const posts = await postModel.find();
          res.status(200).json(posts);
      } catch (error) {
          res.status(500).json({ message: 'Server Error' });
      }
  };
  
    async getById(req: Request, res: Response) {
        super.getById(req, res);
    };

    async deleteItem(req: Request, res: Response) {
        super.deleteItem(req, res);
        };

    async updateItem(req: FileRequest, res: Response) {
        if (req.file){
            console.log('postbody',req.body);
            const port = process.env.PORT;
            const postId = req.body.id;
            const imgUrl = req.body.imgUrl;            
            const formData = new FormData();
            const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
            formData.append('file', fileBlob, req.file.originalname);

            // Make request to your file upload endpoint
            const response = await fetch(`http://localhost:${port}/storage?imgId=${postId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const fileData = await response.json();            

            const finalUrl = `http://localhost:${port}/storage/${postId}`+'/'+fileData.url.split('/').pop();
            req.body.imgUrl = finalUrl;
        }
        super.updateItem(req, res);
    };
    async deleteAllItems(req:Request, res:Response){
        try {
            const posts = await postModel.find(); // Fetch all posts first
            const deletePromises = posts.map(post => {
                return postModel.findByIdAndDelete(post._id); // Return the promise to delete each post
            });
    
            // Wait for all deletion promises to resolve
            await Promise.all(deletePromises);
    
            console.log('All items removed');
            res.status(200).json({ message: 'All items removed' });
        } catch (error) {
            console.error('Error deleting items:', error);
            res.status(500).json({ message: 'Deletion error', error });
        }
    };
}


export default new PostsController();