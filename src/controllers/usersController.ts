import usersModel from "../models/usersModel";

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


export default {
  getAllUsers,
  createAUser,
  updateUserEmailByUsername,
  getUserByUsername,
  deleteUserByUsername,
};