const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const paymentLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'payment_limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 withdrawal attempts per window
  message: 'Too many withdrawal attempts, please try again later.'
});

module.exports = { paymentLimiter };