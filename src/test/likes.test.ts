import request from 'supertest';
import express from 'express';
import initApp from '../server';
import UserModel from '../models/usersModel';
import PostModel from '../models/postsModel';
import LikeModel from '../models/likedObjectModel';
import { connectToTestDatabase, clearDatabase, closeDatabase } from './testSetup';

describe('Likes Routes Integration Tests', () => {
  let app: express.Application;
  let accessToken: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    await connectToTestDatabase();
    app = (await initApp()) as express.Application;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Register a user and get access token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    accessToken = registerResponse.body.accessToken;
    const user = await UserModel.findOne({ email: 'test@example.com' });
    userId = user?._id.toString() || '';

    // Create a test post
    const post = await PostModel.create({
      title: 'Test Post',
      content: 'This is a test post',
      owner: userId
    });
    postId = post._id.toString();
  });

  describe('POST /likes', () => {
    it('should add a like to a post', async () => {
      const response = await request(app)
        .post('/likes')
        .send({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(201);
      
      // Verify like was created in database
      const like = await LikeModel.findOne({ 
        userId, 
        objectId: postId, 
        objType: 'post' 
      });
      expect(like).toBeTruthy();
    });

    it('should not allow duplicate likes', async () => {
      // First like
      await request(app)
        .post('/likes')
        .send({
          userId,
          objectId: postId,
          objType: 'post'
        });

      // Try to like again
      const response = await request(app)
        .post('/likes')
        .send({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /likes', () => {
    beforeEach(async () => {
      // Add a like before each test
      await LikeModel.create({
        userId,
        objectId: postId,
        objType: 'post'
      });
    });

    it('should remove a like', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(200);
      
      // Verify like was removed from database
      const like = await LikeModel.findOne({ 
        userId, 
        objectId: postId, 
        objType: 'post' 
      });
      expect(like).toBeNull();
    });

    it('should return 404 when trying to remove non-existent like', async () => {
      // Remove existing like first
      await LikeModel.deleteMany({
        userId,
        objectId: postId,
        objType: 'post'
      });

      const response = await request(app)
        .delete('/likes')
        .send({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /likes/check', () => {
    beforeEach(async () => {
      // Add a like before each test
      await LikeModel.create({
        userId,
        objectId: postId,
        objType: 'post'
      });
    });

    it('should check if user has liked an object', async () => {
      const response = await request(app)
        .get('/likes/check')
        .query({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(200);
      expect(response.body.hasLiked).toBe(true);
    });

    it('should return false when user has not liked an object', async () => {
      // Remove existing like
      await LikeModel.deleteMany({
        userId,
        objectId: postId,
        objType: 'post'
      });

      const response = await request(app)
        .get('/likes/check')
        .query({
          userId,
          objectId: postId,
          objType: 'post'
        });

      expect(response.status).toBe(200);
      expect(response.body.hasLiked).toBe(false);
    });
  });

  describe('GET /likes/:objectId/:objType', () => {
    beforeEach(async () => {
      // Add multiple likes
      await LikeModel.create([
        {
          userId,
          objectId: postId,
          objType: 'post'
        },
        {
          userId: 'anotherUser',
          objectId: postId,
          objType: 'post'
        }
      ]);
    });

    it('should get all likes for an object', async () => {
      const response = await request(app)
        .get(`/likes/${postId}/post`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /likes/:objectId/:objType/count', () => {
    beforeEach(async () => {
      // Add multiple likes
      await LikeModel.create([
        {
          userId,
          objectId: postId,
          objType: 'post'
        },
        {
          userId: 'anotherUser',
          objectId: postId,
          objType: 'post'
        }
      ]);
    });

    it('should get like count for an object', async () => {
      const response = await request(app)
        .get(`/likes/${postId}/post/count`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });
  });
});