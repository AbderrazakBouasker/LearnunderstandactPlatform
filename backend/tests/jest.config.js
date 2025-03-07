export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  testEnvironment: "node",
  setupFilesAfterEnv: ["./setup.js"],
  verbose: true,
  testMatch: ["**/tests/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
