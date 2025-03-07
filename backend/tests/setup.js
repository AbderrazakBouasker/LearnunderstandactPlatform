import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

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
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log("Disconnected from in-memory MongoDB");
});
