/**
 * Jest configuration for @innerflame/ai-tools
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Use ESM for imports
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // Configure test pattern matching
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  // Setup files
  setupFilesAfterEnv: [],
  // Other options
  verbose: true,
}; 