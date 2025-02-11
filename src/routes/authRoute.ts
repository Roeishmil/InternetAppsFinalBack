import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import authController from '../controllers/authController';
import UserModel from '../models/usersModel';
import dotenv from 'dotenv';
import { Console } from 'console';
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

declare global {
  namespace Express {
    interface User {
      userId: string;
    }
  }
}

dotenv.config();
const REDIRECT_URI = process.env.REDIRECT_URI;

// const REDIRECT_URI = '<http://localhost:3000/auth/google/callback>';

const router = express.Router();

// Verify that required environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required environment variables for Google OAuth');
}

// Initialize passport with Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.CALLBACK_URL,
      passReqToCallback: true
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // First try to find user by googleId
        let user = await UserModel.findOne({ googleId: profile.id });
        
        if (!user) {
          // If not found by googleId, try email
          user = await UserModel.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // If user exists with email but no googleId, update their profile
            user.googleId = profile.id;
            // Update profile picture if available
            if (profile.photos && profile.photos[0]) {
              user.imgUrl = profile.photos[0].value;
            }
            await user.save();
          } else {
            // Create new user if doesn't exist
            const username = `${profile.displayName}_${Math.random().toString(36).slice(2, 7)}`;
            user = await UserModel.create({
              email: profile.emails[0].value,
              username: username, // Adding random string to ensure uniqueness
              googleId: profile.id,
              refreshToken: []
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
      const user = await UserModel.findById(id);
      done(null, user as Express.User | null);
  } catch (error) {
      done(error, null);
  }
});

// Initialize Passport middleware
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
      scope: ['profile', 'email']
  })
);


// Add this to your authRoute.ts
router.get('/verify-config', (req, res) => {
  try {
      const config = {
          clientIDExists: !!process.env.GOOGLE_CLIENT_ID,
          clientIDLength: process.env.GOOGLE_CLIENT_ID?.length,
          clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
          clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
          callbackURL: process.env.CALLBACK_URL
      };
      
      res.json({
          message: 'Configuration check',
          config: {
              ...config,
              clientIDPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 6) + '...',
              clientSecretPrefix: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 6) + '...'
          }
      });
  } catch (error) {
      res.status(500).json({ message: 'Error checking configuration', error: String(error) });
  }
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=true' }),
  async (req: any, res) => {
      try {
          const user = req.user;
          
          const tokens = authController.generateToken(user._id);
          if (!tokens) {
              throw new Error('Failed to generate tokens');
          }
          
          await UserModel.findByIdAndUpdate(user._id, {
            $push: { refreshToken: tokens.refreshToken }
        });
          
          // // Set tokens in cookies
          // res.cookie('accessToken', accessToken, {
          //     httpOnly: true,
          //     secure: process.env.NODE_ENV === 'production',
          //     sameSite: 'lax',
          //     maxAge: 15 * 60 * 1000 // 15 minutes
          // });
          
          // res.cookie('refreshToken', refreshToken, {
          //     httpOnly: true,
          //     secure: process.env.NODE_ENV === 'production',
          //     sameSite: 'lax',
          //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          // });
          
          // Redirect to frontend with success
          res.redirect(`http://localhost:5173/?login=success&token=${tokens.accessToken}`);
          //res.redirect('http://localhost:5173/?login=success');
      } catch (error) {
          console.error('Error in Google callback:', error);
          res.redirect('http://localhost:5173/login?error=true');
      }
  }
);

/**
* @swagger
* components:
*   securitySchemes:
*     bearerAuth:
*       type: http
*       scheme: bearer
*       bearerFormat: JWT
*   schemas:
*     User:
*       type: object
*       required:
*         - email
*         - password
*       properties:
*         username:
*           type: string
*           description: The user username
*         email:
*           type: string
*           description: The user email
*         password:
*           type: string
*           description: The user password
*       example:
*         username: 'Bobby'
*         email: 'bob@gmail.com'
*         password: '123456'
*     AuthResponse:
*       type: object
*       properties:
*         accessToken:
*           type: string
*           description: JWT access token
*         refreshToken:
*           type: string
*           description: JWT refresh token
*         id:
*           type: string
*           description: User ID
*         username:
*           type: string
*           description: Username
*     ErrorResponse:
*       type: object
*       properties:
*         message:
*           type: string
*           description: Error message
*/

/**
* @swagger
* tags:
*   name: Auth
*   description: The Authentication API
*/

/**
* @swagger
* /auth/register:
*   post:
*     summary: Register a new user
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/User'
*     responses:
*       200:
*         description: Registration successful
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/AuthResponse'
*       400:
*         description: Invalid input or duplicate user
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Server error
*/
router.post('/register', async (req, res, next) => {
  try {
      await authController.register(req, res);
  } catch (error) {
      next(error);
  }
});


/**
* @swagger
* /auth/login:
*   post:
*     summary: Login user
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - email
*               - password
*             properties:
*               email:
*                 type: string
*               password:
*                 type: string
*     responses:
*       200:
*         description: Login successful
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/AuthResponse'
*       400:
*         description: Invalid credentials
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Server error
*/
router.post('/login', async (req, res, next) => {
  try {
      await authController.login(req, res);
  } catch (error) {
      next(error);
  }
});


/**
* @swagger
* /auth/refresh:
*   post:
*     summary: Refresh access token
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - refreshToken
*             properties:
*               refreshToken:
*                 type: string
*     responses:
*       200:
*         description: Token refresh successful
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 accessToken:
*                   type: string
*                 refreshToken:
*                   type: string
*                 id:
*                   type: string
*       401:
*         description: Invalid refresh token
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Server error
*/

router.post('/refresh', async (req, res, next) => {
  try {
      await authController.refresh(req, res);
  } catch (error) {
      next(error);
  }
});

/**
* @swagger
* /auth/logout:
*   post:
*     summary: Logout user
*     tags: [Auth]
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - refreshToken
*             properties:
*               refreshToken:
*                 type: string
*     responses:
*       200:
*         description: Logout successful
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 message:
*                   type: string
*       400:
*         description: Invalid refresh token
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*       500:
*         description: Server error
*/
router.post('/logout', async (req, res, next) => {
  try {
      await authController.logout(req, res);
  } catch (error) {
      next(error);
  }
});
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Update the existing declaration in authRoute.ts


router.get('/profile', authController.authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found in request' });
      return;
    }

    const user = await UserModel.findById(userId).select('-password -refreshToken');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




// google auth accurding to the documentation but it doesnt work



  // Initiates the Google Login flow
  router.get('/auth/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
    res.redirect(url);
  });
  
  // Callback URL for handling the Google Login response
  router.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
  
    try {
      // Exchange authorization code for access token
      const { data } = await axios.post('<https://oauth2.googleapis.com/token>', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      });
  
      const { access_token, id_token } = data;
  
      // Use access_token or id_token to fetch user profile
      const { data: profile } = await axios.get('<https://www.googleapis.com/oauth2/v1/userinfo>', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
  
      // Code to handle user authentication and retrieval using the profile data
  
      res.redirect('/');
    } catch (error) {
      console.error('Error:', (error as any).response.data.error);
      res.redirect('/login');
    }
  });
  
  


export default router;