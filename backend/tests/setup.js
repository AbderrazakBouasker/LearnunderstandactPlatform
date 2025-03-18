import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';

// Mock using ESM compatible approach
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn()
};

// Mock logger in ESM compatible way
jest.unstable_mockModule('../logger.js', () => ({
  default: mockLogger,
  __esModule: true
}));

dotenv.config();

let mongoServer;

// Setup test environment variables
process.env.jwtSecret = process.env.jwtSecret || 'test_secret_key';

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Disconnect mongoose if it's already connected
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
  console.log("Connected to in-memory MongoDB");
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  // Reset all mocks after each test
  jest.clearAllMocks();
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log("Disconnected from in-memory MongoDB");
});

// Export the mock for direct access in tests
export { mockLogger };
