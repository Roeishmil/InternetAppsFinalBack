import request from 'supertest';
import express from 'express';
import initApp from '../server';
import UserModel from '../models/usersModel';
import { connectToTestDatabase, clearDatabase, closeDatabase } from './testSetup';

describe('Authentication Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connectToTestDatabase();
    app = (await initApp()) as express.Application;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Verify user was created in database
      const user = await UserModel.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user?.username).toBe('testuser');
    });

    it('should reject registration with existing email', async () => {
      // First, create a user
      await UserModel.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'hashedpassword'
      });

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register a user and get refresh token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: 'refreshuser',
          email: 'refresh@example.com',
          password: 'password123'
        });

      refreshToken = registerResponse.body.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalidtoken' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register a user and get access token
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: 'profileuser',
          email: 'profile@example.com',
          password: 'password123'
        });

      accessToken = registerResponse.body.accessToken;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'profileuser');
      expect(response.body).toHaveProperty('email', 'profile@example.com');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});