require('dotenv').config();

const app = require('./schedules');

// This exports the express app so Vercel or other platforms can treat it as a serverless function
module.exports = (req, res) => {
  app(req, res);
};
