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
};
