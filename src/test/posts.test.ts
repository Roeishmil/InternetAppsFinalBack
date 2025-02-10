import request from 'supertest';
import express from 'express';
import initApp from '../server';
import UserModel from '../models/usersModel';
import PostModel from '../models/postsModel';
import { connectToTestDatabase, clearDatabase, closeDatabase } from './testSetup';

describe('Posts Routes Integration Tests', () => {
  let app: express.Application;
  let accessToken: string;
  let userId: string;

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
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Test Post')
        .field('content', 'This is a test post')
        .field('owner', userId);

      expect(response.status).toBe(201);

      // Fetch the created post to verify details
      const createdPost = await PostModel.findOne({ title: 'Test Post' });
      expect(createdPost).toBeTruthy();
      expect(createdPost?.title).toBe('Test Post');
      expect(createdPost?.content).toBe('This is a test post');
      expect(createdPost?.owner.toString()).toBe(userId);
    });

    it('should reject post creation without authentication', async () => {
      const response = await request(app)
        .post('/posts')
        .field('title', 'Test Post')
        .field('content', 'This is a test post')
        .field('owner', userId);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /posts', () => {
    beforeEach(async () => {
      // Create some test posts
      await PostModel.create([
        { title: 'Post 1', content: 'Content 1', owner: userId },
        { title: 'Post 2', content: 'Content 2', owner: userId }
      ]);
    });

    it('should get all posts', async () => {
      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[1]).toHaveProperty('content');
    });
  });

  describe('GET /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await PostModel.create({
        title: 'Single Post',
        content: 'This is a single post',
        owner: userId
      });
      postId = post._id.toString();
    });

    it('should get a single post by ID', async () => {
      const response = await request(app).get(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Single Post');
      expect(response.body).toHaveProperty('content', 'This is a single post');
    });
  });

  describe('PUT /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await PostModel.create({
        title: 'Original Post',
        content: 'Original content',
        owner: userId
      });
      postId = post._id.toString();
    });

    it('should update a post', async () => {
      const response = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('id', postId)
        .field('title', 'Updated Post')
        .field('content', 'Updated content');

      expect(response.status).toBe(200);

      // Fetch the updated post to verify details
      const updatedPost = await PostModel.findById(postId);
      expect(updatedPost?.title).toBe('Updated Post');
      expect(updatedPost?.content).toBe('Updated content');
    });

    it('should reject post update without authentication', async () => {
      const response = await request(app)
        .put(`/posts/${postId}`)
        .field('id', postId)
        .field('title', 'Updated Post')
        .field('content', 'Updated content');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await PostModel.create({
        title: 'Post to Delete',
        content: 'This post will be deleted',
        owner: userId
      });
      postId = post._id.toString();
    });

    it('should delete a post', async () => {
      const response = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Verify post is deleted
      const deletedPost = await PostModel.findById(postId);
      expect(deletedPost).toBeNull();
    });

    it('should reject post deletion without authentication', async () => {
      const response = await request(app).delete(`/posts/${postId}`);

      expect(response.status).toBe(401);
    });
  });
});