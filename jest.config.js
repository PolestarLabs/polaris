module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/test/helpers/globals.js"],
  collectCoverageFrom: [
    "core/archetypes/**/*.js",
    "core/structures/**/*.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary"],
  verbose: true,
  forceExit: true,
};
