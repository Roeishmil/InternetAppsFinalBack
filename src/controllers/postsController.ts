import postModel, { Ipost } from "../models/postsModel";
import { Request, Response } from "express";
import BaseController from "./baseController";

class PostsController extends BaseController<Ipost> {
    constructor() {
        super(postModel);
    }

    async create(req: Request, res: Response) {
        const userId = req.body.owner;
        const post = {
            ...req.body,
            owner: userId
        }
        req.body = post;
        super.create(req, res);
    };

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

    async updateItem(req: Request, res: Response) {
        super.updateItem(req, res);
    };
}


export default new PostsController();