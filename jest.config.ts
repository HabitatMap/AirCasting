export default {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+.(gif|svg|png|jpg|eot|ttf|woff|woff2)$": "jest-transform-stub",
  },
  moduleNameMapper: {
    "^.+.(gif|svg|png|jpg|eot|ttf|woff|woff2)$": "jest-transform-stub",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Was react-only and .tsx-only. The account screens are plain TypeScript
  // outside app/javascript/react, and their tests were invisible to the runner.
  testRegex: "app/javascript/.*\\.test\\.tsx?$",
};
