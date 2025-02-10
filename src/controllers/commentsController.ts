import commentsModel, { IComments } from "../models/commentsModel";
import { Request, Response } from "express";
import BaseController from "./baseController";

class CommentsController extends BaseController<IComments> {
    constructor() {
        super(commentsModel);
    }

    async create(req: Request, res: Response) {
        const userId = req.body.owner;
        const comment = {
            ...req.body,
            owner: userId
        }
        req.body = comment;
        super.create(req, res);
    };

    async getAll(req: Request, res: Response) {
        try {
            const comments = await commentsModel.find();
            res.status(200).json(comments);
        } catch (error) {
            res.status(500).json({ message: 'Server Error' });
        }
    };

    async getAllByPostId(req: Request, res: Response) {
        try {
            const filter = req.params.id;
            if(filter){
                const comments = await commentsModel.find({postId : filter});
                res.status(200).json(comments);
            }
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

export default new CommentsController();