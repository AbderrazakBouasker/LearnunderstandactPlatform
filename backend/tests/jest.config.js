export default {
  transform: {},
  // Remove extensionsToTreatAsEsm since it's automatically inferred from package.json
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['./setup.js'],
  testTimeout: 15000
};
