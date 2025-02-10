import request from 'supertest';
import express from 'express';
import initApp from '../server';
import CommentsModel from '../models/commentsModel';
import { connectToTestDatabase, clearDatabase, closeDatabase } from './testSetup';

describe('Comments Routes Integration Tests', () => {
  let app: express.Application;
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

    // Setup test user and post (mock data)
    userId = 'testUser123';
    postId = 'testPost456';
  });

  describe('POST /comments', () => {
    it('should create a new comment successfully', async () => {
      const commentData = {
        comment: 'This is a test comment',
        postId: postId,
        owner: userId,
        ownerName: 'Test User'
      };

      const response = await request(app)
        .post('/comments')
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('comment', commentData.comment);
      expect(response.body).toHaveProperty('postId', postId);
      expect(response.body).toHaveProperty('owner', userId);
    });

    it('should handle creating a comment with missing fields', async () => {
      const incompleteComment = {
        comment: 'Incomplete comment'
      };

      const response = await request(app)
        .post('/comments')
        .send(incompleteComment);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /comments', () => {
    beforeEach(async () => {
      // Create multiple comments
      await CommentsModel.create([
        {
          comment: 'First test comment',
          owner: userId,
          postId: postId,
          ownerName: 'Test User'
        },
        {
          comment: 'Second test comment',
          owner: userId,
          postId: postId,
          ownerName: 'Test User'
        }
      ]);
    });

    it('should retrieve all comments', async () => {
      const response = await request(app)
        .get('/comments');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should retrieve comments for a specific post', async () => {
      const response = await request(app)
        .get(`/comments/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.every((comment: any) => comment.postId === postId)).toBe(true);
    });
  });

  describe('PUT /comments/:id', () => {
    let commentId: string;
    let originalComment: any;

    beforeEach(async () => {
      // Create a comment to update
      const comment = await CommentsModel.create({
        comment: 'Original comment',
        owner: userId,
        postId: postId,
        ownerName: 'Test User'
      });

      commentId = comment._id.toString();
      originalComment = comment;
    });

    it('should update an existing comment', async () => {
      const response = await request(app)
        .put(`/comments/${commentId}`)
        .send({ comment: 'Updated comment content' });

      // Diagnostic logging
      console.log('Update Response Status:', response.status);
      console.log('Update Response Body:', response.body);

      // Verify the response
      expect(response.status).toBe(200);

      // Verify the comment was actually updated in the database
      const updatedComment = await CommentsModel.findById(commentId);
      expect(updatedComment).not.toBeNull();
      expect(updatedComment?.comment).toBe('Updated comment content');

      // If the response body is empty, fetch the updated comment
      if (Object.keys(response.body).length === 0) {
        const fetchResponse = await request(app).get(`/comments/${postId}`);
        const updatedCommentInResponse = fetchResponse.body.find((c: any) => c._id === commentId);
        
        expect(updatedCommentInResponse).toBeDefined();
        expect(updatedCommentInResponse.comment).toBe('Updated comment content');
      } else {
        // If response body is not empty, check its properties
        expect(response.body).toHaveProperty('comment', 'Updated comment content');
      }
    });
  });

  describe('DELETE /comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      // Create a comment to delete
      const comment = await CommentsModel.create({
        comment: 'Comment to delete',
        owner: userId,
        postId: postId,
        ownerName: 'Test User'
      });

      commentId = comment._id.toString();
    });

    it('should delete an existing comment', async () => {
      const response = await request(app)
        .delete(`/comments/${commentId}`);

      expect(response.status).toBe(200);

      // Verify comment is deleted
      const checkComment = await CommentsModel.findById(commentId);
      expect(checkComment).toBeNull();
    });
  });
});