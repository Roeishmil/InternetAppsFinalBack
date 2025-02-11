import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/usersModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
    };
  }
}

type Payload = {
_id: string;
random: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
const authorization = req.header('Authorization');
if (!authorization) {
res.status(401).send('Access Denied: No token provided');
return;
}

const token = authorization.split(' ')[1];

if (!token) {
res.status(401).send('Access Denied: Invalid token format');
return;
}

if (!process.env.TOKEN_SECRET) {
res.status(500).send('Server Error: Token secret not configured');
return;
}

try {
const verified = jwt.verify(token, process.env.TOKEN_SECRET) as Payload;
req.user = { userId: verified._id };
console.log('auth successful');
next();    
} catch (err) {
res.status(401).send('Access Denied: Invalid token');
}
};


type tTokens = {
  accessToken: string;
  refreshToken: string;
};

const generateToken = (userId: string): tTokens | null => {
  if (!process.env.TOKEN_SECRET) {
    return null;
  }

  const random = Math.random().toString();
  const accessToken = jwt.sign(
    {
      _id: userId,
      random: random
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES || '15m' }
  );

  const refreshToken = jwt.sign(
    {
      _id: userId,
      random: random
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
  );

  return {
    accessToken,
    refreshToken
  };
};

const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      refreshToken: [] // Initialize empty refresh token array
    });

    // Generate tokens
    const tokens = generateToken(user._id.toString());
    if (!tokens) {
      return res.status(500).json({ message: 'Error generating tokens' });
    }

    // Store refresh token
    user.refreshToken = [tokens.refreshToken];
    await user.save();

    // Send response
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      id: user._id,
      username: user.username
    });

  } catch (error) {
    if ((error as any).code === 11000) {
      const duplicateField = Object.keys((error as any).keyPattern)[0];
      return res.status(400).json({
        message: `Duplicate ${duplicateField} error: This ${duplicateField} is already taken.`
      });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password!);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const tokens = generateToken(user._id.toString());
    if (!tokens) {
      return res.status(500).json({ message: 'Error generating tokens' });
    }

    // Update refresh tokens
    if (!user.refreshToken) {
      user.refreshToken = [];
    }
    user.refreshToken.push(tokens.refreshToken);
    await user.save();

    // Send response
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      id: user._id,
      username: user.username
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

const verifyRefreshToken = async (refreshToken: string): Promise<any> => {
  if (!process.env.TOKEN_SECRET) {
    throw new Error('Server Error: Token secret not configured');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.TOKEN_SECRET!, async (err: any, payload: any) => {
      if (err) {
        return reject('Invalid refresh token');
      }

      try {
        const user = await userModel.findById(payload._id);
        if (!user || !user.refreshToken?.includes(refreshToken)) {
          return reject('Invalid refresh token');
        }
        resolve(user);
      } catch (err) {
        reject('Server error during token verification');
      }

      jwt.verify(refreshToken, process.env.TOKEN_SECRET!, async (err: any, payload: any) => {
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
  });
};

const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const user = await verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const tokens = generateToken(user._id);
    if (!tokens) {
      return res.status(500).json({ message: 'Error generating tokens' });
    }

    // Update refresh tokens
    user.refreshToken = user.refreshToken.filter((token: string) => token !== refreshToken);
    user.refreshToken.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      id: user._id
    });

  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const user = await verifyRefreshToken(refreshToken);
    
    // Remove the refresh token
    user.refreshToken = user.refreshToken.filter((token: string) => token !== refreshToken);
    await user.save();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid refresh token' });
  }
};

export default {
  register,
  login,
  logout,
  refresh,
  authMiddleware,
  generateToken
};

