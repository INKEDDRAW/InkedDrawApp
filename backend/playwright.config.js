module.exports = {
  testDir: './',
  testMatch: ['**/playwright-api-test.js', '**/demo-api-test.js', '**/visual-api-test.js'],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
  },
  reporter: 'line',
};
