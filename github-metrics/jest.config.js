module.exports = {
  transform: {
    "^.+\\.jsx?$": `<rootDir>/jest-preprocess.js`,
  },
  moduleNameMapper: {
    ".+\\.(css|styl|less|sass|scss)$": `identity-obj-proxy`,
    ".+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": `<rootDir>/__mocks__/file-mock.js`,
    ".+\\.(mdx)$": `<rootDir>/__mocks__/mdx-mock.js`,
  },
  testPathIgnorePatterns: [`node_modules`, `\\.cache`, `<rootDir>.*/public`],
  transformIgnorePatterns: [`node_modules/(?!(gatsby|gatsby-plugin-mdx|@eto|@mdx-js|@mui)/)`],
  globals: {
    __PATH_PREFIX__: ``,
  },
  setupFiles: [
    `<rootDir>/loadershim.js`,
    'jest-canvas-mock',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!**/*.test.*',
    '!**/__tests__/**',
  ],
  setupFilesAfterEnv: ["<rootDir>/setup-test-env.js"],
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: `http://localhost`,
  }
}
