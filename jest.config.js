const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/utilities/(.*)$': '<rootDir>/utilities/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'utilities/**/*.{js,jsx}',
    'utils/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/*.config.js',
    '!components/layout/Landing.js',
    '!components/common/HamburgerMenu.js',
    '!components/player/VideoPlayer.js',
  ]
}

module.exports = createJestConfig(customJestConfig)