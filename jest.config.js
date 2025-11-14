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
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'contexts/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/*.config.js',
    '!components/layout/Landing.js',
    '!components/common/HamburgerMenu.js',
    '!components/player/VideoPlayer.js',
  ]
}

module.exports = createJestConfig(customJestConfig)