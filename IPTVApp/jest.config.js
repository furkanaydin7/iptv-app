module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  clearMocks: true,
};

