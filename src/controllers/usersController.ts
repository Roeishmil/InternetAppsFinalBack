import usersModel from "../models/usersModel";
import fileRouter from "../routes/fileRoute"
import { Blob } from 'buffer'; // Import Blob from the 'buffer' module if necessary
import { Request, Response } from "express";

interface FileRequest extends Request {
    file?: Express.Multer.File;
}

const getAllUsers = async (req:any, res:any) => {
  const filter = req.query.username;
  try {
    if (filter) {
      const users = await usersModel.find({ username: filter });
      res.send(users);
    } else {
      const users = await usersModel.find();
      res.send(users);
    }
  } catch (error:any) {
    res.status(400).send(error.message);
  }
};

const getUserByUsername = async (req:any, res:any) => {
  const username = req.params.username;

  try {
    const user = await usersModel.findOne({username : username });
    if (user) {
      res.send(user);
    } else {
      res.status(404).send("user not found");
    }
  } catch (error:any) {
    res.status(400).send(error.message);
  }
};

const createAUser = async (req:any, res:any) => {
  const userBody = req.body;
  console.log('User creation reached',req.body)
  try {
    const user = await usersModel.create(userBody);
    res.status(201).send(user);
  } catch (error:any) {
    res.status(400).send(error.message);
  }
};

const updateUserEmailByUsername = async (req:any, res:any) => {
    const username = req.params.username; //Get the id from the json
    const userBody = req.body;
    try {
        const user = await usersModel.updateOne({username : username} , {$set: {email:userBody.content}});
        if (user) {
          res.send(user);
        } else {
          res.status(404).send("user not found");
        }
      } catch (error:any) {
        res.status(400).send(error.message);
      }
};

const deleteUserByUsername = async (req:any, res:any) => {
  const username = req.params.username; //Get the id from the json
  try {
      const user = await usersModel.deleteOne({username : username});
      if (user) {
        res.send(user);
      } else {
        res.status(404).send("user not found");
      }
    } catch (error:any) {
      res.status(400).send(error.message);
    }
};


const updateUserImageByUsername = async (req:FileRequest, res:Response) => {
  console.log('Reached image update');
    const user = req.body;
    const userId = user.id; //Get the id from the json
    const port = process.env.PORT;

    try {
      // If there's a file, upload it using the file route
      if (req.file) {
        console.log('reached file creation');
        
        // Create form data for file upload
        const formData = new FormData();
        const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', fileBlob, req.file.originalname);

        // Make request to your file upload endpoint
        const response = await fetch(`http://localhost:${port}/storage?imgId=${userId}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload file');
        }

        const fileData = await response.json();
        
        // Update post with file URL
        if (fileData.url) {
        const finalUrl = `http://localhost:${port}/storage/${userId}`+'/'+fileData.url.split('/').pop();
        console.log("photo file url" , finalUrl);
        user.imgUrl = finalUrl;
        console.log("User file url" , user.imgUrl);
        await usersModel.updateOne({username : user.username} , {$set: {imgUrl:finalUrl}});
        }
        // Return the complete updated post
        res.status(201).json({status: 201,  message:'Image updated successfully'});
      }
      } catch (error:any) {
        res.status(400).send(error.message);
      }
};

export default {
  getAllUsers,
  createAUser,
  updateUserEmailByUsername,
  getUserByUsername,
  deleteUserByUsername,
  updateUserImageByUsername,
};