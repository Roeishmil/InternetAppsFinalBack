import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/usersModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';


type Payload = {
  _id: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization');
  const token = authorization && authorization.split(' ')[1];

  if (!token) {
      res.status(401).send('Access Denied');
      return;
  }
  if (!process.env.TOKEN_SECRET) {
      res.status(500).send('Server Error');
      return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
      if (err) {
          res.status(401).send('Access Denied');
          return;
      }
      req.params.userId = (payload as Payload)._id;
      next();
  });
};

const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

type tTokens ={
    accessToken: string,
    refreshToken: string
}

const generateToken = (userId: string): tTokens | null => {
  if (!process.env.TOKEN_SECRET) {
    return null;
  }
  // generate token
  const random = Math.random().toString();
  const accessToken = jwt.sign({
    _id: userId,
    random: random
  },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES });

  const refreshToken = jwt.sign({
    _id: userId,
    random: random
  },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
  return {
    accessToken: accessToken,
    refreshToken: refreshToken
  };
};

const login = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if(!user){
      res.status(400).send('Invalid username or password'); 
      return;
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      res.status(400).send('Invalid username or password');
      return;
    }
    if(!process.env.TOKEN_SECRET){
      res.status(500).send('Server Error - key')
      return;
    }
    // Generate JWT
    const token = generateToken(user.username);
    if (!token) {
      res.status(500).send('Server Error - token')
      return;
    }
    if (!user.refreshToken) {
      user.refreshToken = [];
    }
    user.refreshToken.push(token.refreshToken);
    await user.save();
    res.status(200).send(
      {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: user._id
      });
  } catch (error) {
    res.status(400).send(error);
  }
};

type tUser = Document<unknown, {}, IUser> & IUser & Required<{
  _id: string;
}> & {
  __v: number;
}

const verifyRefreshToken = async (refreshToken: string | undefined): Promise<any> => {
  return new Promise((resolve, reject) => {
      //get refresh token from body
      if (!refreshToken) {
          reject("access denied");
          return;
      }
      //verify token
      if (!process.env.TOKEN_SECRET) {
          reject("access denied");
          return;
      }
      jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, payload: any) => {
          if (err) {
              reject("access denied");
              return
          }
          //get the user id from token
          
          const userId = payload._id;
          try {
              //get the user form the db
              const user = await userModel.findOne({username:userId});
              if (!user) {
                  reject("access denied");
                  return;
              }
              if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
                  user.refreshToken = [];
                  await user.save();
                  reject("access denied");
                  return;
              }
              //remove the current token from the user's refreshToken list
              const tokens = user.refreshToken!.filter((token) => token !== refreshToken);
              user.refreshToken = tokens;
              resolve(user);
          } catch (err) {
              reject("fail");
              return;
          }
      });
  });
}

const logout = async (req: Request, res: Response) => {
  try {
      const user = await verifyRefreshToken(req.body.refreshToken);
      await user.save();
      res.status(200).send("success");
  } catch (err) {
      res.status(400).send("fail");
  }
};

  const refresh= async (req: Request, res: Response) => {
    try{
      const user = await verifyRefreshToken(req.body.refreshToken);
      if(!user){
        res.status(400).send("access denied");
        return;
      }
      const token = generateToken(user._id);

      if(!token){
        res.status(500).send("server error");
        return;
      }
      if(!user.refreshToken){
        user.refreshToken = [];
      }
      user.refreshToken.push(token.refreshToken);
      await user.save();
      res.status(200).send({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: user._id
      });
    } catch(err){
      res.status(400).send("access denied");
    }
  };

  export default {
    register,
    login,
    logout,
    refresh
  };
