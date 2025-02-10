import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Utility function to connect to test database
export async function connectToTestDatabase() {
  if (!process.env.TEST_DB_CONNECT) {
    throw new Error('TEST_DB_CONNECT is not defined in .env.test file');
  }

  try {
    await mongoose.connect(process.env.TEST_DB_CONNECT);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Utility function to clear database between tests
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

// Utility function to close database connection
export async function closeDatabase() {
  await mongoose.connection.close();
}

// Global setup before all tests
beforeAll(async () => {
  await connectToTestDatabase();
});

// Clear database before each test
beforeEach(async () => {
  await clearDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await closeDatabase();
});