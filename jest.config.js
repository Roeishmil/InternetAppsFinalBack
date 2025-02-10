export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        useESM: true,
        tsconfig: 'tsconfig.json'
      }]
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    globals: {
      'ts-jest': {
        diagnostics: {
          warnOnly: true
        }
      }
    }
  };